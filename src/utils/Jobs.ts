import { getKey, putKey } from "../services/utils/cache";

const prefixString = "MyJob";
export default {
    push: async (jobName:string, enity: any) => {
        const enityStr = JSON.stringify(enity);
        const currentIndexKey = `${prefixString}/${jobName}/currentIndexKey`;
        let currentIndex: string | number | null = await getKey(currentIndexKey);
        if(!currentIndex || parseInt(currentIndex)<=0){
            currentIndex = await putKey(currentIndexKey, "0");
        }
        currentIndex = parseInt(currentIndex);
        currentIndex++;
        await putKey(currentIndexKey, currentIndex.toString());
        const indexKey = `${prefixString}/${jobName}/${currentIndex.toString()}`;
        await putKey(indexKey, enityStr);
      

    },

    pop: async (jobName:string, callBack: (enity:any)=>void) => {
        const currentIndexKey = `${prefixString}/${jobName}/currentIndexKey`;
        const headIndexKey = `${prefixString}/${jobName}/haedIndexKey`;
        let currentIndex: number | string | null = await getKey(currentIndexKey);
        if(!currentIndex || parseInt(currentIndex)<=0){
            return callBack(null);
        }
        currentIndex = parseInt(currentIndex);

        let headIndex: number | string | null = await getKey(headIndexKey);
        if(!headIndex || parseInt(headIndex) > currentIndex){
            await putKey(headIndexKey, "1");
            await putKey(currentIndexKey, '0');
            return callBack(null);
        }
        headIndex = parseInt(headIndex);
        
        const indexKey = `${prefixString}/${jobName}/${headIndex.toString()}`;
        const value = await getKey(indexKey);
        console.log({
            headIndex,
            value,
            currentIndex
        });
        

        headIndex++;
        await putKey(headIndexKey, headIndex.toString());
        
        callBack(value);

    }
}