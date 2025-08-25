// yaha ye ek wrapper fn hai iske 2 methods hai first : Promise  and sec: trycatch

// Promise
const asyncHandler = (handler) => {                    // (1) higher-order fn, handler = async (req,res,next)=>{}
  return (req, res, next) => {                         // (2) Express ko ye wrapper diya jata hai
    Promise
      .resolve(handler(req, res, next))                // (3) handler chalaya; resolve ensures async errors catchable
      .catch((err) => next(err));                      // (4) error aaya to Express error middleware ko de do
  };
};



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