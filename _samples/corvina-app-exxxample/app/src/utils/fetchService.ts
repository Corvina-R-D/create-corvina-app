import { ISecurityDTO } from "../stores/security";
import { constants } from "./constants";

export const fetchService = (security: ISecurityDTO) =>
    async (url: string, init: RequestInit = {}) => {
        const input = `${constants.serviceUrl}/${security.instanceId}/${security.connect?.organizationId}/${url}`;
        const requestInit = {
            method: init.method || 'GET',
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${security.connect?.jwt}`,
                ...init.headers,
            },
            body: init.body
        } as RequestInit;

        let response = await fetch(input, requestInit)
            .catch(error => {
                console.error(error);
                return {
                    ok: false,
                } as Response;
            })

        return response
    }

export const extractErrorMessageFromResponse = async (response: Response): Promise<string> => {
    let { message } = await response.json();

    if (message instanceof Array) {
        return message[0]
    } else if (typeof message === 'object') {
        return JSON.stringify(message)
    } 

    return message
}