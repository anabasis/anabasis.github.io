#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const REFRESH_TOKEN = process.env.VELOG_REFRESH_TOKEN;
const ACCESS_TOKEN_DIRECT = process.env.VELOG_ACCESS_TOKEN;
const VELOG_USERNAME = process.env.VELOG_USERNAME ?? '';
const GQL = 'https://v3.velog.io/graphql';
const INDEX_PATH = path.resolve('data/velog-index.json');
const CHANGED_FILES = 'changed_posts.txt';

function loadIndex() {
  return fs.existsSync(INDEX_PATH)
    ? JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'))
    : {};
}

function saveIndex(index) {
  fs.mkdirSync(path.dirname(INDEX_PATH), { recursive: true });
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n');
}

async function graphql(query, variables = {}, cookie = '') {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://velog.io',
      'Referer': 'https://velog.io/',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await res.text();

  console.log(`[DEBUG] HTTP ${res.status}, body length: ${text.length}, content-type: ${res.headers.get('content-type')}`);

  if (!text) {
    throw new Error(`빈 응답 수신 (HTTP ${res.status})`);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`JSON 파싱 실패 (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }

  if (json.errors?.length) {
    throw new Error(json.errors.map(e => e.message).join(' | '));
  }
  return json.data;
}

async function getAccessToken() {
  if (ACCESS_TOKEN_DIRECT) {
    console.log('VELOG_ACCESS_TOKEN 직접 사용');
    return ACCESS_TOKEN_DIRECT;
  }

  console.log('refresh_token으로 access_token 갱신 시도...');
  const data = await graphql(
    `mutation { refreshToken { access_token } }`,
    {},
    `refresh_token=${REFRESH_TOKEN}`,
  );
  return data.refreshToken.access_token;
}

async function publishPost(filePath, index, accessToken) {
  if (!fs.existsSync(filePath)) {
    console.log(`파일 없음, 건너뜀: ${filePath}`);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: fm, content } = matter(raw);

  if (fm.draft === true) {
    console.log(`초안 건너뜀: ${fm.title}`);
    return;
  }
  if (fm.velog !== true) {
    console.log(`velog: true 없음, 건너뜀: ${fm.title}`);
    return;
  }

  const slug = path.basename(filePath, '.md');
  const tags = Array.isArray(fm.tags) ? fm.tags : [];
  const existingId = index[slug];
  const cookie = `access_token=${accessToken}`;

  const postInput = {
    title: fm.title,
    body: content.trim(),
    tags,
    is_markdown: true,
    is_temp: false,
    is_private: false,
    url_slug: slug,
    thumbnail: null,
    meta: {},
    series_id: null,
  };

  if (existingId) {
    console.log(`수정 중: ${fm.title} (ID: ${existingId})`);
    const result = await graphql(
      `mutation EditPost($id: ID!, $input: EditPostInput!) {
        editPost(id: $id, input: $input) { id url_slug }
      }`,
      { id: existingId, input: postInput },
      cookie,
    );
    const post = result.editPost;
    const url = VELOG_USERNAME ? `https://velog.io/@${VELOG_USERNAME}/${post.url_slug}` : post.url_slug;
    console.log(`완료 (수정): ${fm.title} → ${url}`);
  } else {
    console.log(`게시 중: ${fm.title}`);
    const result = await graphql(
      `mutation WritePost($input: WritePostInput!) {
        writePost(input: $input) { id url_slug }
      }`,
      { input: postInput },
      cookie,
    );
    const post = result.writePost;
    index[slug] = post.id;
    const url = VELOG_USERNAME ? `https://velog.io/@${VELOG_USERNAME}/${post.url_slug}` : post.url_slug;
    console.log(`완료 (신규): ${fm.title} → ${url}`);
  }
}

(async () => {
  if (!ACCESS_TOKEN_DIRECT && !REFRESH_TOKEN) {
    console.error('VELOG_ACCESS_TOKEN 또는 VELOG_REFRESH_TOKEN 중 하나가 필요합니다');
    process.exit(1);
  }

  if (!fs.existsSync(CHANGED_FILES)) {
    console.log('changed_posts.txt 없음, 종료');
    return;
  }

  const changedFiles = fs.readFileSync(CHANGED_FILES, 'utf-8')
    .trim()
    .split('\n')
    .filter(f => f.endsWith('.md'));

  if (changedFiles.length === 0) {
    console.log('변경된 포스트 없음');
    return;
  }

  console.log('Velog 액세스 토큰 갱신 중...');
  const accessToken = await getAccessToken();
  console.log('토큰 갱신 완료');

  const index = loadIndex();

  for (const file of changedFiles) {
    await publishPost(path.resolve(file), index, accessToken);
  }

  saveIndex(index);
  console.log('data/velog-index.json 업데이트 완료');
})();
