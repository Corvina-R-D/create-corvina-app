import { reactive } from 'vue'
import { CorvinaConnect, CorvinaConnectEventType, ITheme } from '@corvina/corvina-app-connect'

export interface ISecurityDTO {
    connect?: CorvinaConnect,
    corvinaHost?: string,
    instanceId?: string,
    key?: string,
}

interface ISecurityStore extends ISecurityDTO {
    buildCorvinaConnect: (security: ISecurityDTO) => Promise<void>;
}

const createCorvinaConnect = async ({ corvinaHost }: { corvinaHost: string }) : Promise<CorvinaConnect> => {
    console.log("createCorvinaConnect", corvinaHost)

    let connect = await CorvinaConnect.create({ corvinaHost })

    connect.on(CorvinaConnectEventType.ORGANIZATION_ID_CHANGED, (organizationId: string) => {
        console.log(`Organization ID changed to ${organizationId}`)

        // this key is used to trigger a reload of the app when organization changes
        security.key = organizationId;
    });

    connect.on(CorvinaConnectEventType.JWT_CHANGED, (jwt: string) => {
        console.log(`JWT changed to ${jwt}`)
    });

    connect.on(CorvinaConnectEventType.THEME_CHANGED, (t: ITheme) => {
        console.log(`Theme changed to ${JSON.stringify(t)}`)
        theme = t
    });

    (<any>window).connect = connect

    return connect;
}

async function createSecurityFromSessionStorage(): Promise<ISecurityDTO | undefined> {
    let jsObj = JSON.parse(sessionStorage.getItem("security") as string)

    if (jsObj) {
        if (jsObj.corvinaHost) {
            jsObj.connect = await createCorvinaConnect({ corvinaHost: jsObj.corvinaHost })
        }

        return jsObj as ISecurityDTO
    }

    return undefined
}

let security: ISecurityStore;
let theme: ITheme;

export const useSecurity = async () => {
    if (!security) {
        let initSecurity = await createSecurityFromSessionStorage();

        // @ts-ignore
        security = reactive({
            ...initSecurity,
            async buildCorvinaConnect(security: ISecurityDTO = {}): Promise<void> {
                this.connect = await createCorvinaConnect({ corvinaHost: security.corvinaHost || "" });

                this.corvinaHost = security.corvinaHost;
                this.instanceId = security.instanceId;
                this.key = this.connect?.organizationId;
                theme = this.connect?.theme;

                localStorage.setItem("security", JSON.stringify(security));
            }
        } as ISecurityStore)
    }

    return security
}

export const useTheme = () => {
    return theme;
}