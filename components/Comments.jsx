import React, { useState, useEffect } from 'react'
import moment from 'moment'
import parse from 'html-react-parser'
import { getComments } from '../services'

const Comments = ({slug}) => {
  const [comments, setComments] = useState([]);

useEffect(() => {
getComments(slug)
.then((result) => setComments(result))
}, [slug])

  return (
    <>
      {comments.length > 0 && (
        <div className='bg-[#141413] border-2 border-[#2186f3] shadow-lg rounded-lg p-8 pb-12 mb-8 shadow-[#2196f360]'>
          <h3 className="text-xl mb-8 font-semibold border-b border-[#2186f3] pb-4">
        {comments.length}
        {' '}
        comments
          </h3>
          {comments.map((comment) => (
            <div key={comment.createdAt} className='border-b border-[#d4d4d4] mb-4 pb-4'>
              <p className='mb-4'>
                <span className='font-semibold'>{comment.name}</span>
                {' '}
                 on
                {' '}
                {moment(comment.createdAt).format('MMMM DD, YYYY')}
              </p>
              <p className='whitespace-pre-line text-[#d4d4d4] w-full'>{parse(comment.comment)}</p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default Comments