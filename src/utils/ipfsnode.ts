import * as IPFS from 'ipfs';
let node = null;
export default async function ipfsnode() {
    const validIp4 = '/ip4/67.209.177.130/tcp/4001/ipfs/QmR17SmBoMKVFLCF9ZXu3Vdycw9exqq14PxiEj6oygP5qT';
    if (node) {
        return node;
    }
    node = await IPFS.create({
        start: false,
    });
    console.log(
        await node.id()
    );
    const res = await node.bootstrap.add(validIp4);

    console.log(res.Peers);

    await node.start();

    const peerInfos = await node.swarm.addrs()

    peerInfos.forEach(info => {
        console.log(info.id)
        info.addrs.forEach(addr => console.log(addr.toString()))
    })

    try {
        const ipfs = await ipfsnode();
        const statsImages = await ipfs.files.stat('/images')
        if(!statsImages.cid){
            await ipfs.files.mkdir('/images');
        }
        const statsVideos = await ipfs.files.stat('/videos')
        if(!statsVideos.cid){
            await ipfs.files.mkdir('/videos');
        }
    } catch (e) {
        console.error(e);
        
    }
    return node;
}