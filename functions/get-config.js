const faunadb = require('faunadb');
const q = faunadb.query;

// 初始化Fauna客户端
const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

exports.handler = async function(event, context) {
  try {
    // 尝试获取配置
    const response = await client.query(
      q.Let(
        {
          configDoc: q.If(
            q.Exists(q.Match(q.Index('config_by_id'), 'main')),
            q.Get(q.Match(q.Index('config_by_id'), 'main')),
            null
          )
        },
        {
          config: q.If(
            q.IsNull(q.Var('configDoc')),
            null,
            q.Select(['data', 'config'], q.Var('configDoc'))
          )
        }
      )
    );

    // 设置CORS头以允许跨域请求
    const headers = {
      "Access-Control-Allow-Origin": "*", // 允许任何来源访问
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('获取配置出错:', error);
    
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: '获取配置时出错', details: error.message })
    };
  }
};