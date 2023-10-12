import React, { useState, useEffect } from 'react'
import Link from 'next/link'

import { getCategories } from '../services'

const Categories = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then((newCategories) => setCategories(newCategories))
  }, [])
  return (
    <div className='bg-[#141413] shadow-lg shadow-[#2196f360] border-2 border-[#2196f3] rounded-lg p-8 mb-8'>
      <h3 className='text-xl mb-8 font-semibold border-b border-[#2196f3] pb-4'>
        Categories
      </h3>
      {categories.map((category) => (
        <Link href={`/category/${category.slug}`} key={category.slug}>
          <span className="cursor-pointer block pb-3 mb-3 transition duration-700
hover:text-[#2196f3]">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  )
}

export default Categories