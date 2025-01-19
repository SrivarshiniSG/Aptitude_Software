export const saveQuizState = (state) => {
    try {
        if (!state?.questions?.queue || !state?.result?.username) {
            console.log('Invalid state structure, not saving');
            return;
        }
        
        const stateToSave = {
            queue: state.questions.queue,
            answers: state.questions.answers,
            trace: state.questions.trace,
            result: state.result.result,
            userDetails: {
                username: state.result.username,
                email: state.result.email,
                regNo: state.result.regNo,
                department: state.result.department,
                departmentId: state.result.departmentId
            },
            timestamp: new Date().getTime()
        };
        
        // Save to both localStorage and sessionStorage
        localStorage.setItem('quizState', JSON.stringify(stateToSave));
        sessionStorage.setItem('quizActive', 'true');
        sessionStorage.setItem('currentUser', state.result.email);
        sessionStorage.setItem('quizStateBackup', JSON.stringify(stateToSave));
        
        console.log('State saved successfully');
    } catch (error) {
        console.error('Error saving quiz state:', error);
    }
};

export const loadQuizState = () => {
    try {
        // Try to get state from both storages
        const localState = localStorage.getItem('quizState');
        const sessionState = sessionStorage.getItem('quizStateBackup');
        const isQuizActive = sessionStorage.getItem('quizActive');
        const currentUser = sessionStorage.getItem('currentUser');
        
        console.log('Loading state:', { 
            hasLocalState: !!localState, 
            hasSessionState: !!sessionState, 
            isQuizActive, 
            currentUser 
        });
        
        // First try session storage as it's more reliable during page reloads
        let state = sessionState ? JSON.parse(sessionState) : null;
        
        // If no session state, try localStorage
        if (!state && localState) {
            state = JSON.parse(localState);
        }
        
        if (!state || !isQuizActive) {
            console.log('No saved state or quiz not active');
            return null;
        }
        
        // Validate state structure
        if (!state.queue || !state.userDetails || !state.userDetails.email) {
            console.log('Invalid state structure');
            clearQuizState();
            return null;
        }
        
        // Check if state is not too old (2 hours)
        if (new Date().getTime() - state.timestamp > 2 * 60 * 60 * 1000) {
            console.log('State too old');
            clearQuizState();
            return null;
        }
        
        // Validate current user matches saved state
        if (currentUser && currentUser !== state.userDetails.email) {
            console.log('User mismatch');
            clearQuizState();
            return null;
        }
        
        return state;
    } catch (error) {
        console.error('Error loading quiz state:', error);
        return null;
    }
};

export const clearQuizState = () => {
    try {
        localStorage.removeItem('quizState');
        sessionStorage.removeItem('quizActive');
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('quizStateBackup');
        console.log('Quiz state cleared');
    } catch (error) {
        console.error('Error clearing quiz state:', error);
    }
};
