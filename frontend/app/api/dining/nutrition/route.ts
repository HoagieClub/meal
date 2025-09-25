import { NextResponse } from 'next/server';
import { request } from '@/lib/http';

export default async function handler(req, res) {
  const url = req.query.url as string;
  const response = await fetch(url);
  const html = await response.text();
  res.status(200).send(html);
}
