import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import axios from 'axios'

/** check user auth  */
export function CheckUserExist({ children }){
    const { username } = useSelector(state => state.result);
    
    // Debug log
    console.log("CheckUserExist - username:", username);
    
    return username ? children : <Navigate to={'/'} replace={true} />;
}

/** get server data */
export async function getServerData(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}

/** post server data */
export const postServerData = async (url, result) => {
    try {
        const response = await axios.post(url, result);
        return response.data;
    } catch (error) {
        console.error("Error in postServerData:", error);
        throw error;
    }
}
