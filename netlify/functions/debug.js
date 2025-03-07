exports.handler = async function(event, context) {
  // 返回环境信息，但不泄露敏感数据
  return {
    statusCode: 200,
    body: JSON.stringify({
      environment: process.env.NODE_ENV,
      hasAdminToken: !!process.env.ADMIN_TOKEN,
      hasFaunaKey: !!process.env.FAUNA_SECRET_KEY,
      time: new Date().toISOString(),
      headers: event.headers
    })
  };
};