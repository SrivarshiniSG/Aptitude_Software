import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { startExamAction, moveNextAction, movePrevAction } from '../redux/question_reducer'
import api from '../axios/axios'

/** fetch question hook to fetch api data and set value to store */
export const useFetchQestion = () => {
    const dispatch = useDispatch();
    const [getData, setGetData] = useState({ 
        isLoading: false, 
        apiData: [], 
        serverError: null 
    });
    
    const { departmentId } = useSelector(state => state.result);

    useEffect(() => {
        setGetData(prev => ({...prev, isLoading: true}));

        (async () => {
            try {
                const { data } = await api.get(`/api/questions/${departmentId}`);
                
                if (data && data[0]?.questions) {
                    const { questions, answers } = data[0];
                    
                    // Combine all questions in the correct order
                    const allQuestions = [
                        ...questions.aptitude.map(q => ({ ...q, category: 'aptitude' })),
                        ...questions.core.map(q => ({ ...q, category: 'core' })),
                        ...questions.verbal.map(q => ({ ...q, category: 'verbal' })),
                        ...questions.programming.map(q => ({ ...q, category: 'programming' }))
                    ];

                    // Combine all answers in the same order
                    const allAnswers = [
                        ...answers.aptitude,
                        ...answers.core,
                        ...answers.verbal,
                        ...answers.programming
                    ];

                    setGetData({
                        isLoading: false,
                        apiData: allQuestions,
                        serverError: null
                    });

                    // Dispatch to store
                    dispatch(startExamAction({ question: allQuestions, answers: allAnswers }));

                } else {
                    throw new Error("No Questions Available");
                }
            } catch (error) {
                console.error("Error fetching questions:", error);
                setGetData({
                    isLoading: false,
                    apiData: null,
                    serverError: error.message
                });
            }
        })();
    }, [dispatch, departmentId]);

    return [getData, setGetData];
}

/** MoveAction Dispatch function */
export const MoveNextQuestion = () => async (dispatch) => {
    try {
        dispatch(moveNextAction());
    } catch (error) {
        console.log(error);
    }
}

/** PrevAction Dispatch function */
export const MovePrevQuestion = () => async (dispatch) => {
    try {
        dispatch(movePrevAction());
    } catch (error) {
        console.log(error);
    }
}