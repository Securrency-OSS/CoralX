const Config =require('../packages_deprecated_/Config');

const fs = require('fs');

const JobManager = {
    saveJob() {
        if (!fs.existsSync(Config.getJobLogDir())) fs.mkdirSync(Config.getJobLogDir());

        fs.writeFileSync(
            Config.getJobLogPath(),
            JSON.stringify(this.jobModel, null, 4)
        );
    },
}


module.exports = JobManager;
