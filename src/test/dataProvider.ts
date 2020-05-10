import fetch from 'node-fetch';

const apiUrl = 'http://localhost:8080';

interface IGetListParams {
    pagination: {
        page: number;
        perPage: number;
    };
    sort: {
        field: string;
        order: string;
    };
    filter: {
        [x: string]: string;
    }
}

interface IFetchResponse {
    status: number;
    statusText: string;
    json: ()=>{}
}

interface IGetReference {
    ids: Array<number>;
}
interface IGetManyReferences {
    id: number,
    target: number,
    pagination: {
        page: number;
        perPage: number;
    };
    sort: {
        field: string;
        order: string;
    };
    filter: {
        [x: string]: string;
    }
}

interface IParams {
    id: number;
}

interface IUpdateParams {
    id: number,
    data: object,
}

interface IGetList{
    data: Array<any>,
    total: number,
}
interface ICreateResult {
    data: {
        id: number,
        [x: string]: string | number,
    }
}
interface IGetOneResult {
    data: {
        id: number,
        [x: string]: string | number,
    }
}


export default {
    getList: async (resource:string, params: IGetListParams): Promise<IGetList> => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const query = {
            sort: JSON.stringify([field, order]),
            range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
            filter: JSON.stringify(params.filter),
        };
        const url = `${apiUrl}/${resource}?${JSON.stringify(query)}`;
        return fetch(url, {method: 'get'})
        .then((response: IFetchResponse) => {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
        .then(({ data, total }: IGetList) =>({
            data, total
        }) );
    },

    getOne: (resource:string, params: IParams): Promise<IGetOneResult> =>
        fetch(`${apiUrl}/${resource}/${params.id}`)
        .then((response: IFetchResponse) => {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
        .then(({data}: IGetOneResult)=>({
            data,
        })),

    getMany: async (resource:string, params:IGetReference): Promise<IGetList> => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        };
        const url = `${apiUrl}/${resource}?${JSON.stringify(query)}`;
        return fetch(url)
        .then((response: IFetchResponse) => {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
        .then(({ data, total }: IGetList) =>({
            data, total
        }) );
    },

    getManyReference: async (resource:string, params: IGetManyReferences):Promise<IGetList> => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const query = {
            sort: JSON.stringify([field, order]),
            range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
            filter: JSON.stringify({
                ...params.filter,
                [params.target]: params.id,
            }),
        };
        const url = `${apiUrl}/${resource}?${JSON.stringify(query)}`;

        return fetch(url)
        .then((response: IFetchResponse) => {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
        .then(({data, total}: IGetList) => ({
            data, total
        }));
    },

    update: (resource:string, params: IUpdateParams): Promise<IGetOneResult> =>
        fetch(`${apiUrl}/${resource}/${params.id}`)
        .then((response: IFetchResponse) => {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
        .then(({data}: IGetOneResult) => ({
            data
        }))
    ,

    updateMany: async (resource:string, params: IGetReference): Promise<IGetOneResult> => {
        const query = {
            filter: JSON.stringify({ id: params.ids}),
        };
        return fetch(`${apiUrl}/${resource}?${JSON.stringify(query)}`)
        .then((response: IFetchResponse) => {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
        .then(({data}:IGetOneResult)=>({data}));
    },

    create: async (resource:string, params: object): Promise<ICreateResult> =>{
        const body = {
            ...params,
        }
        
        return   fetch(`${apiUrl}/${resource}`, { method: 'POST', body: JSON.stringify(body) })
        .then((response:IFetchResponse) => {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            }
            
            return response.json();
        })
        .then(({data}: any)=>{
            if (data.code === 'users:create:fail') {
                throw new Error(data.reason);
            }
            return {
                data,
            }
        })
    }
    ,
    delete: (resource:string,  params: IParams): Promise<IGetOneResult> =>
        fetch(`${apiUrl}/${resource}/${params.id}`)
        .then((response:IFetchResponse) => {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
        .then(({data}: IGetOneResult)=>({
            data,
        }))
    ,

    deleteMany: (resource:string, params:IGetReference): Promise<IGetOneResult> => {
        const query = {
            filter: JSON.stringify({ id: params.ids}),
        };
        return fetch(`${apiUrl}/${resource}?${JSON.stringify(query)}`)
        .then((response:IFetchResponse) => {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
        .then(({data}: IGetOneResult)=>({
            data,
        }))
    },
};