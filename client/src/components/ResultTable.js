import React, { useEffect, useState } from 'react'
import { getServerData } from '../helper/helper'

export default function ResultTable() {

    const [data, setData] = useState([])

    useEffect(() => {
        getServerData(`/api/result`, (res) => {
            const sortedData = res.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setData(sortedData);
        })
    }, [])

  return (
    <div>
        <table>
            <thead className='table-header'>
                <tr className='table-row'>
                    <td>Name</td>
                    <td>Registration No</td>
                    <td>Score</td>
                    <td>Total Questions</td>
                </tr>
            </thead>
            <tbody>
                {data.length === 0 && <tr><td colSpan="4">No Data Found</td></tr>}
                {
                    data.map((v, i) => (
                        <tr className='table-body' key={i}>
                            <td>{v?.username || ''}</td>
                            <td>{v?.regNo || ''}</td>
                            <td>{v?.points || 0} points</td>
                            <td>{v?.totalQuestions || 0} questions</td>
                        </tr>
                    ))
                }
                
            </tbody>
        </table>
    </div>
  )
}