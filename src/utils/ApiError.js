class apiError {
    constructor(
        statusCode,
        messsge = "Something went wrong",
        errors = [],
        statck = ""
    ){
        super(messsge)
        this.statusCode = statusCode
        this.data = null
        this.messsge = messsge
        this.success = false
        this.errors = errors

        if (statck) {
            this.statck = statck
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {apiError}