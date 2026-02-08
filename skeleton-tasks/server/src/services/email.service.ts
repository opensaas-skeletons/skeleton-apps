/**
 * Email Service
 * =============
 * Reusable SMTP email sender using raw socket connections.
 * Extracted from skeleton-automation's action.service.ts.
 */

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ sent: boolean; to: string; subject: string; messageId: string }> {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) {
    throw new Error(
      "SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD environment variables."
    );
  }

  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPassword = process.env.SMTP_PASSWORD || "";
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  console.log(`[Email] Sending to: ${to}, Subject: ${subject}`);

  const net = await import("net");
  const tls = await import("tls");

  const response = await new Promise<{ sent: boolean; to: string; subject: string; messageId: string }>(
    (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("SMTP connection timed out after 30 seconds"));
      }, 30000);

      let socket: import("net").Socket | import("tls").TLSSocket;
      let buffer = "";
      let step = 0;
      const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@${smtpHost}>`;

      const emailMessage = [
        `From: ${smtpFrom}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `Message-ID: ${messageId}`,
        `Date: ${new Date().toUTCString()}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=UTF-8`,
        ``,
        body,
      ].join("\r\n");

      function processResponse(data: string) {
        buffer += data;
        const lines = buffer.split("\r\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line) continue;
          const code = parseInt(line.substring(0, 3));
          if (line.length > 3 && line[3] === "-") continue;

          if (code >= 400) {
            clearTimeout(timeout);
            socket.destroy();
            reject(new Error(`SMTP error ${code}: ${line}`));
            return;
          }

          step++;
          switch (step) {
            case 1:
              socket.write(`EHLO ${smtpHost}\r\n`);
              break;
            case 2:
              if (smtpPort === 587) {
                socket.write("STARTTLS\r\n");
              } else if (smtpUser) {
                socket.write("AUTH LOGIN\r\n");
              } else {
                step = 5;
                socket.write(`MAIL FROM:<${smtpFrom}>\r\n`);
              }
              break;
            case 3:
              if (smtpPort === 587 && code === 220) {
                const tlsSocket = tls.connect(
                  { socket: socket as import("net").Socket, host: smtpHost },
                  () => {
                    socket = tlsSocket;
                    socket.on("data", (d: Buffer) => processResponse(d.toString()));
                    socket.write(`EHLO ${smtpHost}\r\n`);
                  }
                );
                tlsSocket.on("error", (err: Error) => {
                  clearTimeout(timeout);
                  reject(new Error(`TLS error: ${err.message}`));
                });
                return;
              }
              if (smtpUser) {
                socket.write(Buffer.from(smtpUser).toString("base64") + "\r\n");
              } else {
                step = 5;
                socket.write(`MAIL FROM:<${smtpFrom}>\r\n`);
              }
              break;
            case 4:
              if (smtpUser) {
                socket.write(Buffer.from(smtpPassword).toString("base64") + "\r\n");
              }
              break;
            case 5:
              socket.write(`MAIL FROM:<${smtpFrom}>\r\n`);
              break;
            case 6:
              socket.write(`RCPT TO:<${to}>\r\n`);
              break;
            case 7:
              socket.write("DATA\r\n");
              break;
            case 8:
              socket.write(emailMessage + "\r\n.\r\n");
              break;
            case 9:
              socket.write("QUIT\r\n");
              clearTimeout(timeout);
              socket.end();
              resolve({ sent: true, to, subject, messageId });
              break;
          }
        }
      }

      if (smtpPort === 465) {
        socket = tls.connect({ host: smtpHost, port: smtpPort }, () => {});
      } else {
        socket = net.createConnection({ host: smtpHost, port: smtpPort });
      }

      socket.setEncoding("utf8");
      socket.on("data", (data: string) => processResponse(data));
      socket.on("error", (err: Error) => {
        clearTimeout(timeout);
        reject(new Error(`SMTP connection error: ${err.message}`));
      });
    }
  );

  return response;
}
