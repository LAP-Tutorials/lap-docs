import { NextRequest, NextResponse } from "next/server"
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

export const dynamic = "force-dynamic"

function sanitizeIpKey(ip: string): string {
  return ip.trim().replace(/^::ffff:/, "").replace(/[:.]/g, "_").toLowerCase()
}

function extractClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")

  let clientIp = ""
  if (forwardedFor) {
    clientIp = forwardedFor.split(",")[0].trim()
  } else if (realIp) {
    clientIp = realIp.trim()
  } else if (cfConnectingIp) {
    clientIp = cfConnectingIp.trim()
  } else {
    clientIp = "127.0.0.1"
  }

  clientIp = clientIp.replace(/^::ffff:/, "").trim()

  if (!clientIp || clientIp === "::1") {
    clientIp = "127.0.0.1"
  }

  return clientIp
}

async function checkIsIpBanned(clientIp: string): Promise<{ isBanned: boolean; reason: string }> {
  const sanitizedKey = sanitizeIpKey(clientIp)
  try {
    const bannedDoc = await getDoc(doc(db, "bannedIps", sanitizedKey))
    if (bannedDoc.exists()) {
      return {
        isBanned: true,
        reason: bannedDoc.data()?.reason || "Violations of Community Guidelines",
      }
    }

    // Also check if raw IP or un-sanitized IP matches
    const q = query(collection(db, "bannedIps"), where("ip", "==", clientIp))
    const snap = await getDocs(q)
    if (!snap.empty) {
      return {
        isBanned: true,
        reason: snap.docs[0].data()?.reason || "Violations of Community Guidelines",
      }
    }
  } catch (dbErr) {
    console.warn("Could not check banned IP status from Firestore:", dbErr)
  }
  return { isBanned: false, reason: "" }
}

export async function GET(request: NextRequest) {
  try {
    const clientIp = extractClientIp(request)
    const { isBanned, reason } = await checkIsIpBanned(clientIp)

    return NextResponse.json({
      ip: clientIp,
      isBanned,
      reason,
    })
  } catch (err: any) {
    console.error("Error in GET /api/auth/ip:", err)
    return NextResponse.json(
      { ip: "127.0.0.1", isBanned: false, error: err?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = extractClientIp(request)

    let uid = ""
    try {
      const body = await request.json()
      uid = body?.uid || ""
    } catch {
      // body empty or not json
    }

    if (uid) {
      try {
        await updateDoc(doc(db, "users", uid), {
          lastIp: clientIp,
        })
      } catch (saveErr) {
        console.warn(`Could not update lastIp for user ${uid}:`, saveErr)
      }
    }

    const { isBanned, reason } = await checkIsIpBanned(clientIp)

    return NextResponse.json({
      ip: clientIp,
      isBanned,
      reason,
      updated: Boolean(uid),
    })
  } catch (err: any) {
    console.error("Error in POST /api/auth/ip:", err)
    return NextResponse.json(
      { ip: "127.0.0.1", isBanned: false, error: err?.message },
      { status: 500 }
    )
  }
}
