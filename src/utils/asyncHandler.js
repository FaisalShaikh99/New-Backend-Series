// yaha ye ek wrapper fn hai iske 2 methods hai first : Promise  and sec: trycatch

// Promise
const asyncHandler = (requestHandler) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
}



export {asyncHandler}  // export fn

//trycatch
// const asyncHandler = (fn) = async (req, res, next) => {
//     try {
        //  await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success : false,
//             message : error.message
//         })  
//     }
// }