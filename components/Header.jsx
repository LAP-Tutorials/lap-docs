import React, {useState, useEffect } from 'react'
import Image from 'next/image'

import Link from 'next/link'

import { getCategories } from '../services'

import logo from '../public/logo.png'

const Header = () => {
    const [categories, setCategories] = useState([]);
    
    useEffect(() => {
      getCategories()
        .then((newCategories) => setCategories(newCategories))
    } , [])
  return (
    <div className="container mx-auto px-10 mb-8">
        <div className="border-b w-full inline-block border-[#2196f3] py-8">
            <div className="md:float-left block">
                <Link href="/">
                {/* <Image alt="" height="50" width="50" className='rounded-md mb-4' src={logo} /> */}
                    <span className="cursor-pointer font-bold text-4xl text-white">
                        LAP Docs
                    </span>
                </Link>
            </div>
            <div className="hidden md:float-left md:contents">
                {categories.map((category) => (
                    <Link key={category.slug} href={`/category/${category.slug}`}>
                        <span className="md:float-right mt-2 align-middle text-white ml-4 font-semibold cursor-pointer transition duration-700
hover:text-[#2196f3]">
                            {category.name}
                        </span>
                    </Link>
                ))}
            </div>
        </div>

    </div>
  )
}

export default Header