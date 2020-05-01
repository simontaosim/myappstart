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
        const headIndexKey = `${prefixString}/${jobName}/haedIndexKey`;
        let headIndex: number | string | null = await getKey(headIndexKey);
        if(!headIndex || parseInt(headIndex) > currentIndex){
            await putKey(headIndexKey, "1");
            await putKey(currentIndexKey, '0');
        }
      

    },

    pop: async (jobName:string, callBack: (enity:any, currentIndex:number)=>void) => {
        const currentIndexKey = `${prefixString}/${jobName}/currentIndexKey`;
        const headIndexKey = `${prefixString}/${jobName}/haedIndexKey`;
        let currentIndex: number | string | null = await getKey(currentIndexKey);
        if(!currentIndex || parseInt(currentIndex)<=0){
            currentIndex = 0;
            await putKey(currentIndexKey, '0');
            return callBack(null, currentIndex);
        }
        currentIndex = parseInt(currentIndex);

        let headIndex: number | string | null = await getKey(headIndexKey);
        if(!headIndex){
            await putKey(headIndexKey, "1");
            await putKey(currentIndexKey, '0');
            headIndex = parseInt(headIndex);
            return callBack(null, currentIndex);
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
        if(headIndex > currentIndex){
            await putKey(headIndexKey, "1");
            await putKey(currentIndexKey, '0');
        }else{
            await putKey(headIndexKey, headIndex.toString());
        }
        
        callBack(JSON.parse(value), currentIndex);

    }
}