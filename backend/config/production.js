const helmet = require('helmet');
const compression = require('compression');

function applyProductionConfig(app) {
    if (process.env.NODE_ENV !== 'production') return;
    
    // Express Behind Proxies (Render.com, Nginx, AWS ELB)
    app.set('trust proxy', 1);

    // Advanced Helmet Security Headers
    app.use(helmet({
        contentSecurityPolicy: false, // Turned off carefully if serving local frontend directly without a builder
        crossOriginEmbedderPolicy: false
    }));

    // GZIP compression middleware for blazing fast responses
    app.use(compression());

    // Disable Demo explicitly if not permitted
    if (process.env.DEMO_MODE !== 'true') {
        app.use('/api/demo', (req, res) => {
            res.status(403).json({ success: false, message: 'Demo paths locked in PRD' });
        });
    }

    // Stricter CORS mapping logic
    const allowedOrigins = [
        process.env.FRONTEND_URL || 'https://medsmart-demo.netlify.app'
        // Add specific production URL limits
    ];
    
    // You could map this via corsOptions, but app.use(cors()) is already in server.js, 
    // so this is a supplemental interceptor
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        if (origin && !allowedOrigins.includes(origin)) {
            // Un-comment to strictly enforce 
            // return res.status(403).json({ error: 'CORS Blocked' });
        }
        res.setHeader('X-Powered-By', 'MedSmart Engine');
        next();
    });

    console.log('🛡️ Production security parameters (Helmet, Compression, Proxy Trust) applied.');
}

module.exports = { applyProductionConfig };
