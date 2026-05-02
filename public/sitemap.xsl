<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap - Greenhouse between Clouds</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            color: #333;
            margin: 0 auto;
            padding: 2rem;
            background-color: #fcfcfc;
          }
          .container {
            background: #ffffff;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          }
          h1 { color: #5e7eff; margin-top: 0; }
          .desc { margin-bottom: 2rem; color: #666; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          th { 
            text-align: left; 
            padding: 12px; 
            background: #f4f4f5; 
            border-bottom: 2px solid #e4e4e7; 
            font-weight: 700;
            color: #3f3f46;
          }
          td { 
            padding: 12px; 
            border-bottom: 1px solid #f4f4f5; 
            color: #52525b;
          }
          a { color: #5e7eff; text-decoration: none; font-weight: 500; }
          a:hover { text-decoration: underline; color: #ff9eb6; }
          tr:hover td { background: #fafafa; }
          .count {
            display: inline-block;
            background: #5e7eff;
            color: white;
            padding: 2px 8px;
            border-radius: 99px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>
            XML Sitemap
            <span class="count"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs</span>
          </h1>
          <p class="desc">
            This is a generated XML Sitemap, meant to be consumed by search engines like Google or Bing.<br/>
            You can find more information about XML sitemaps on <a href="https://sitemaps.org" target="_blank">sitemaps.org</a>.
          </p>
          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Last Modified</th>
                <th>Change Frequency</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                  </td>
                  <td><xsl:value-of select="sitemap:lastmod"/></td>
                  <td><xsl:value-of select="sitemap:changefreq"/></td>
                  <td><xsl:value-of select="sitemap:priority"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
