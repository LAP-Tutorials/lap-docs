import React, { useRef, useState, useEffect} from 'react'
import { submitComment } from '../services';

const CommentsForm = ({slug}) => {
  const [error, setError] = useState(false);
const [localStorage, setLocalStorage] = useState(null);
const [showSuccessMessage, setShowSuccessMessage] = useState(false);
const commentEl = useRef();
const nameEl = useRef();
const emailEl = useRef();
const storeDataEl = useRef();

useEffect(() =>{
  nameEl.current.value = window.localStorage?.getItem('name');
  emailEl.current.value = window.localStorage?.getItem('email')
}, [])

const handleCommentSubmission = () => {
setError(false);

const {value: comment} = commentEl.current;
const {value: name} = nameEl.current;
const {value: email} = emailEl.current;
const {checked: storeData} = storeDataEl.current;

if (!comment || !name || !email) {
  setError(true);
  return;
}

const commentObj = {
  name, email, comment, slug
}

if(storeData) {
  window.localStorage.setItem('name', name);
  window.localStorage.setItem('email', email);
} else {
  window.localStorage.removeItem('name', name);
  window.localStorage.removeItem('email', email);
}

submitComment(commentObj).then((res) => {
setShowSuccessMessage(true); setTimeout(() => {setShowSuccessMessage(false);}, 6000)})
}

  return (
    <div className='bg-[#141413] shadow-[#2196f360]
    border-2 border-[#2196f3] shadow-lg rounded-lg p-8 pb-12 mb-8'>
      <h3 className='text-xl mb-8 font-semibold border-b border-[#2196f3] pb-4'>Leave a Comments</h3>
      <div className='grid grid-cols-1 gap-4 mb-4'>
        <textarea ref={commentEl} className='p-4 outline-none border-2 border-[#2186f3] w-full rounded-lg focus:ring-2 focus:ring-[#2196f3] bg-[#141413]
        '
        placeholder='Comment'
        name='comment'/>


      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4'>
        <input 
        type='text' ref={nameEl} className='py-2 px-4 outline-none border-2 border-[#2186f3] w-full rounded-lg focus:ring-[#2196f3] bg-[#141413]
        ' placeholder='Name' name='name'
        />
         <input 
        type='text' ref={emailEl} className='py-2 px-4 outline-none border-2 border-[#2186f3] w-full rounded-lg focus:ring-[#2196f3] bg-[#141413]
        ' placeholder='Email' name='email'
        />
      </div>
      <div className='grid grid-cols-1 gap-4 mb-4'>
        <div>
          <input ref={storeDataEl} type="checkbox" id="storeData" name="storeData" value="true" className="appearance-none cursor-pointer border-2 border-[#2196f3] rounded h-5 w-5 text-blue-600 align-middle checked:bg-[#2196f3]"/>
          <label className='text-[#d4d4d4] cursor-pointer ml-2 align-middle' htmlFor='storeData'>Save my email and name for next time</label>
      
        </div>
      </div>
      {error && <p className='text-s text-red-500'>All fields are required</p>}
      <div className='mt-8'>
        <button type='button' onClick={handleCommentSubmission} className='transition duration-500 ease hover:bg-[#2196f398] inline-block bg-[#2196f3] text-lg rounded-2xl  text-white px-8 py-3 font-medium cursor-pointer'>
Post Comment
        </button>
        {showSuccessMessage && <span className='text-xl float-right font-semibold mt-3 text-green-500'>Comment submitted for review</span>}
      </div>
    </div>
  )
}

export default CommentsForm