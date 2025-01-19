export const questionReducer = (state = {
    queue: [],
    answers: [],
    trace: 0,
    categories: {
        aptitude: { start: 0, end: 9},
        core: { start: 10, end: 29 },
        verbal: { start: 30, end: 39 },
        programming: { start: 40, end: 49 }
    }
}, action) => {
    switch (action.type) {
        case 'START_EXAM':
            return {
                ...state,
                queue: action.payload.question,
                answers: action.payload.answers
            }
        case 'MOVE_NEXT':
            return {
                ...state,
                trace: state.trace + 1
            }
        case 'MOVE_PREV':
            return {
                ...state,
                trace: state.trace - 1
            }
        case 'SET_TRACE':
            return {
                ...state,
                trace: action.payload
            }
        case 'RESET_ALL':
            return {
                queue: [],
                answers: [],
                trace: 0,
                categories: {
                    aptitude: { start: 0, end: 9},
                    core: { start: 10, end: 29 },
                    verbal: { start: 30, end: 39 },
                    programming: { start: 40, end: 49 }
                }
            }
        default:
            return state;
    }
}

/** redux actions */
export const startExamAction = (payload) => ({
    type: 'START_EXAM',
    payload
})

export const moveNextAction = () => ({
    type: 'MOVE_NEXT'
})

export const movePrevAction = () => ({
    type: 'MOVE_PREV'
})

export const setTraceAction = (payload) => ({
    type: 'SET_TRACE',
    payload
})

export const resetAllAction = () => ({
    type: 'RESET_ALL'
})
