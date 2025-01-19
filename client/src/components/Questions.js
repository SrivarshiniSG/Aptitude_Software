import React, { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

/**Custom Hook */
import { useFetchQestion } from '../hooks/FetchQuestion'
import { updateResult } from '../hooks/setResult'

export default function Questions( { onChecked } ) {

    const [checked, setChecked] = useState(undefined)
    const {trace} = useSelector(state =>state.questions)
    const result = useSelector(state =>state.result.result)
    const [{ isLoading, apiData, serverError}] = useFetchQestion()

    // useSelector(state => console.log(state));
    const questions = useSelector(state =>state.questions.queue[state.questions.trace])
    const dispatch = useDispatch()
    // const trace = useSelector(state =>state.questions.trace)
    // const { questions = [] } = useSelector(state => state.questions?.queue?.[0] || {});

    useEffect(() => {
        // Reset checked state when question changes
        setChecked(undefined)
    }, [trace])
    

    function onSelect(i){
      setChecked(i)
      onChecked(i)
    }

    if (isLoading) return <h3 className='text-light'>isLoading</h3>
    if (serverError) {
        const errorMessage = typeof serverError === 'object' 
            ? 'An error occurred while fetching questions' 
            : serverError;
        return <h3 className='text-light'>{errorMessage}</h3>
    }

    if (!questions) return <h3 className='text-light'>No questions available</h3>

    const currentQuestion = useSelector(state => state.questions.queue[state.questions.trace]);
    console.log('Current Question:', currentQuestion);

  return (
    <div className='questions'>
      <h2 className='text-light'>
        {questions.question.includes('\n\n') ? (
          <>
            <div className="passage" style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px'
            }}>
              {questions.question.split('\n\n')[0]}
            </div>
            <div className="sub-question">
              {questions.question.split('\n\n')[1]}
            </div>
          </>
        ) : (
          questions.question
        )}
      </h2>

      <ul key={questions.id}>
        {
          questions.options?.map((q, i) => (
            <li key={i}>
              <input 
                type="radio" 
                value={i}
                name={`question_${trace}`}
                id={`q${i}-option`}
                onChange={() => onSelect(i)}
                checked={checked === i}
              />

              <label className='text-primary' htmlFor={`q${i}-option`}>{q}</label>
              <div className={`check ${checked === i ? 'checked' : ''}`}></div>
            </li>
          ))
        }
      </ul>
      
    </div>
  )
}
