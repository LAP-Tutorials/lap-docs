import React from 'react'
import Image from 'next/image'

const Author = ({ author }) => {
  return (
    <div className='text-center mt-20 mb-8 p-12 relative rounded-lg bg-black bg-opacity-20 border-2 border-[#2196f3]'>
  <div className='absolute left-0 right-0 -top-14 mx-auto'>
    <Image alt={author.name} unoptimized height="100" width="100" className='align-middle rounded-full border-2 border-[#2196f3]' src={author.photo.url} style={{ left: 0, right: 0, margin: 'auto' }} />
  </div>
  <h3 className='text-3xl font-bold my-4'>{author.name}</h3>
  <p className='text-lg'>{author.bio}</p>
</div>
  )
}

export default Author