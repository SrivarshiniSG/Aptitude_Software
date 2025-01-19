import { postServerData } from '../helper/helper'
import * as Action from '../redux/result_reducer'

export const PushAnswer = (result) => async (dispatch) => {
    try {
        await dispatch(Action.updateResult(result));
    } catch (error) {
        console.log(error)
    }
}

export const updateResult = ({ trace, checked }) => async (dispatch) => {
    try {
        dispatch(Action.updateResult({ trace, checked }))
    } catch (error) {
        console.log(error)
    }
}

/** insert user data */
export const usePublishResult = (resultData) => {
    const { result, username, regNo } = resultData;
    
    (async () => {
        try {
            if(!result?.length || !username || !regNo) {
                throw new Error("Couldn't get Result");
            }
            
            // Calculate points before sending
            const points = result.reduce((score, answer, index) => {
                if (answer !== undefined && answer === resultData.answers[index]) {
                    return score + 1;
                }
                return score;
            }, 0);

            const dataToSubmit = {
                ...resultData,
                points
            };

            console.log("Submitting result data:", dataToSubmit);
            
            await postServerData(
                `/api/result`, 
                dataToSubmit
            );
        } catch (error) {
            console.log(error)
        }
    })();
}

