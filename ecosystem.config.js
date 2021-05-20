module.exports = {
    apps: [
        {
            name: `GridAsync`,
            watch: true,
            script: `src/application.ts`,
            error_file: `./logs/error.log`,
            out_file: `./logs/out.log`,
            combine_logs: true,
            log_date_format: "YYYY-MM-DD HH:mm Z",
            interpreter: "./node_modules/.bin/ts-node",
            env: {
                PORT: 3000
            },
        }
    ],
}