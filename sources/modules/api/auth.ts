import axios from 'axios';
import * as z from 'zod';
import { HappyError } from '@/modules/errors/HappyError';
import { SERVER_ENDPOINT } from '@/config';

export async function requestAuth(login: string, key: string) {
    let schema = z.union([z.object({
        ok: z.literal(true),
    }), z.object({
        ok: z.literal(false),
        error: z.union([z.literal('too_many_attempts'), z.literal('invalid_login')])
    })]);
    let res = await axios.post(`https://${SERVER_ENDPOINT}/auth/start`, { login, key });
    let body = schema.safeParse(res.data);
    if (!body.success) {
        throw new Error('Invalid response');
    }
    if (!body.data.ok) {
        if (body.data.error === 'invalid_login') {
            throw new HappyError('Entered phone number or email is invalid, please try again', false);
        }
        if (body.data.error === 'too_many_attempts') {
            throw new HappyError('Too many attempts, please try again later', true);
        }
        throw new Error('Invalid response');
    }
}

export async function requestAuthVerify(login: string, key: string, code: string) {
    let schema = z.union([z.object({
        ok: z.literal(true),
        token: z.string()
    }), z.object({
        ok: z.literal(false),
        error: z.union([z.literal('invalid_login'), z.literal('invalid_code'), z.literal('expired_code')])
    })]);
    let res = await axios.post(`https://${SERVER_ENDPOINT}/auth/verify`, { login, key, code });
    let body = schema.safeParse(res.data);
    if (!body.success) {
        throw new Error('Invalid response');
    }
    if (!body.data.ok) {
        if (body.data.error === 'expired_code') {
            return null;
        }
        if (body.data.error === 'invalid_code') {
            throw new HappyError('Entered code is invalid', false);
        }
        throw new Error('Invalid response');
    }
    return body.data.token;
}