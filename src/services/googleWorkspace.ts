// Service to interact directly with Google Drive and Google Sheets APIs using the user's OAuth access token

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export const googleWorkspace = {
  // --- Google Drive Integration ---
  async listFiles(accessToken: string): Promise<DriveFileItem[]> {
    if (!accessToken) throw new Error('Token akses Google tidak tersedia.');

    const res = await fetch(
      'https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,iconLink,webViewLink,webContentLink,size,createdTime,modifiedTime)&orderBy=modifiedTime desc',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gagal mengambil berkas Drive: ${res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
  },

  async createFolder(accessToken: string, name: string): Promise<DriveFileItem> {
    if (!accessToken) throw new Error('Token akses Google tidak tersedia.');

    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gagal membuat folder di Drive: ${res.statusText}`);
    }

    return res.json();
  },

  async uploadTextFile(
    accessToken: string,
    filename: string,
    content: string,
    mimeType = 'text/plain'
  ): Promise<DriveFileItem> {
    if (!accessToken) throw new Error('Token akses Google tidak tersedia.');

    const metadata = {
      name: filename,
      mimeType: mimeType,
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,createdTime',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gagal mengunggah berkas ke Drive: ${res.statusText}`);
    }

    return res.json();
  },

  // --- Google Sheets Integration ---
  async createSpreadsheet(
    accessToken: string,
    title: string,
    sheets: Array<{ title: string; rows: (string | number)[][] }>
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    if (!accessToken) throw new Error('Token akses Google tidak tersedia.');

    // 1. Create spreadsheet structure
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
        sheets: sheets.map(s => ({
          properties: {
            title: s.title,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        })),
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gagal membuat Google Sheets: ${createRes.statusText}`);
    }

    const createdData = await createRes.json();
    const spreadsheetId = createdData.spreadsheetId;
    const spreadsheetUrl = createdData.spreadsheetUrl;

    // 2. Populate values if rows are provided
    for (const s of sheets) {
      if (s.rows && s.rows.length > 0) {
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
            s.title
          )}!A1:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              values: s.rows,
            }),
          }
        );
      }
    }

    return { spreadsheetId, spreadsheetUrl };
  },
};
