const faunadb = require('faunadb');
const q = faunadb.query;

// 初始化Fauna客户端
const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

exports.handler = async function(event, context) {
  // 设置CORS头以允许跨域请求
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
  
  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: headers,
      body: ''
    };
  }

  // 验证HTTP方法
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: headers,
      body: JSON.stringify({ error: '只允许POST请求' })
    };
  }
  
  // 验证管理员令牌
  const token = event.headers['x-admin-token'];
  if (token !== process.env.ADMIN_TOKEN) {
    console.error('令牌不匹配:', { received: token, expected: process.env.ADMIN_TOKEN });
    return {
      statusCode: 403,
      headers: headers,
      body: JSON.stringify({ error: '未授权' })
    };
  }
  
  try {
    // 解析请求体
    const config = JSON.parse(event.body);
    
    // 检查配置有效性
    if (!config || typeof config !== 'object') {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ error: '无效的配置数据' })
      };
    }
    
    // 更新或创建配置文档
    const response = await client.query(
      q.If(
        q.Exists(q.Match(q.Index('config_by_id'), 'main')),
        // 更新现有配置
        q.Update(
          q.Select(
            ['ref'],
            q.Get(q.Match(q.Index('config_by_id'), 'main'))
          ),
          {
            data: {
              config: config,
              updated_at: q.Now()
            }
          }
        ),
        // 创建新配置
        q.Create(
          q.Collection('configs'),
          {
            data: {
              id: 'main',
              config: config,
              created_at: q.Now(),
              updated_at: q.Now()
            }
          }
        )
      )
    );
    
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('保存配置出错:', error);
    
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: '保存配置时出错', details: error.message })
    };
  }
};