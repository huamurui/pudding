<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> - RSS Feed</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <style type="text/css">
          body {
            font-family: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 15px;
            color: #333;
            margin: 0;
            padding: 2rem;
            background-color: #fcfcfc;
            line-height: 1.6;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header-card {
            background: #ffffff;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            margin-bottom: 2rem;
            border-top: 6px solid #5e7eff;
          }
          h1 { 
            color: #5e7eff; 
            margin-top: 0; 
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .rss-icon {
            background: #f26522;
            color: white;
            border-radius: 4px;
            padding: 2px 8px;
            font-size: 14px;
            font-weight: bold;
          }
          .desc { 
            color: #666; 
            margin-bottom: 1.5rem;
          }
          .info {
            background: #f4f4f5;
            padding: 1rem;
            border-radius: 8px;
            font-size: 14px;
            color: #52525b;
          }
          .post-card {
            background: #ffffff;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.03);
            margin-bottom: 1.5rem;
            transition: transform 0.2s;
          }
          .post-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0,0,0,0.06);
          }
          .post-title {
            font-size: 1.5rem;
            margin: 0 0 0.5rem 0;
          }
          .post-title a {
            color: #1f2937;
            text-decoration: none;
          }
          .post-title a:hover {
            color: #5e7eff;
          }
          .post-meta {
            font-size: 13px;
            color: #8c8c8c;
            margin-bottom: 1rem;
          }
          .post-desc {
            color: #4b5563;
          }
          a { color: #5e7eff; text-decoration: none; font-weight: 500; }
          a:hover { text-decoration: underline; color: #ff9eb6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-card">
            <h1>
              <span class="rss-icon">RSS</span>
              <xsl:value-of select="/rss/channel/title"/>
            </h1>
            <p class="desc"><xsl:value-of select="/rss/channel/description"/></p>
            <div class="info">
              这是一个 RSS 订阅源。你可以将当前页面的 URL 复制并粘贴到任意的 RSS 阅读器（如 NetNewsWire, Reeder, Inoreader）中来订阅本博客的最新文章。
            </div>
            <p style="margin-top: 1rem; margin-bottom: 0;">
              <a href="{/rss/channel/link}">← 返回博客首页</a>
            </p>
          </div>

          <h2>最新文章</h2>
          <xsl:for-each select="/rss/channel/item">
            <div class="post-card">
              <h3 class="post-title">
                <a href="{link}" target="_blank">
                  <xsl:value-of select="title"/>
                </a>
              </h3>
              <div class="post-meta">
                发布于：<xsl:value-of select="pubDate" />
              </div>
              <div class="post-desc">
                <xsl:value-of select="description" />
              </div>
            </div>
          </xsl:for-each>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
