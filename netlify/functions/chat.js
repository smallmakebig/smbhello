// netlify/functions/chat.js
// Proxy function để gọi Claude API an toàn (không lộ API key)

export default async (req) => {
  // Chỉ chấp nhận POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const { message, context } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

    if (!CLAUDE_API_KEY) {
      return new Response(JSON.stringify({ 
        content: [{ text: 'AI chưa được cấu hình. Vui lòng liên hệ admin.' }] 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const systemPrompt = `Bạn là trợ lý đào tạo của SMB Training Hub — hệ thống training nội bộ cho công ty dịch vụ Debt Settlement.

Quy tắc:
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu
- Dựa trên kiến thức training nội bộ bên dưới
- Nếu câu hỏi ngoài phạm vi, nói rõ và gợi ý nguồn tham khảo
- Không bịa thông tin không có trong tài liệu
- Thân thiện, chuyên nghiệp

Kiến thức training:
${context || 'Chưa có dữ liệu training.'}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      content: [{ text: 'Lỗi hệ thống. Vui lòng thử lại sau.' }] 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};

export const config = {
  path: '/.netlify/functions/chat'
};
