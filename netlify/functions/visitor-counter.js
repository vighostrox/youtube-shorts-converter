// Server-side visitor counter for more accurate tracking
const visitors = new Map();

exports.handler = async function(event, context) {
  // Only count GET requests to the main page
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const clientIP = event.headers['client-ip'] || 
                    event.headers['x-forwarded-for'] || 
                    'unknown';
    
    const userAgent = event.headers['user-agent'] || 'unknown';
    
    // Create a unique visitor identifier (privacy-friendly)
    const visitorId = Buffer.from(`${clientIP}-${userAgent}`).toString('base64').slice(0, 16);
    
    const today = new Date().toDateString();
    
    // Initialize today's count if not exists
    if (!visitors.has(today)) {
      visitors.set(today, new Set());
    }
    
    const todayVisitors = visitors.get(today);
    const isNewVisitor = !todayVisitors.has(visitorId);
    
    if (isNewVisitor) {
      todayVisitors.add(visitorId);
    }
    
    const totalVisitors = Array.from(visitors.values())
      .reduce((total, daySet) => total + daySet.size, 0);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        totalVisitors: totalVisitors,
        todayVisitors: todayVisitors.size,
        isNewVisitor: isNewVisitor,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Counter error',
        details: error.message 
      })
    };
  }
};