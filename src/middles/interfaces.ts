export interface IACLParams  {
    roleIds: Array<number>,
    resourceId: null | number | undefined
    userId: number,
    resource: string,
    method: "post" | "get" | "remove" | "put" | "unknown",
}
