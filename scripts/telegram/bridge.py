#!/usr/bin/env python3
"""Telegram MTProto bridge for Signal Canvas (Telethon user client)."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

SESSION_DIR = Path.home() / ".signal-canvas" / "telegram"


def session_path() -> Path:
    user = os.environ.get("SIGNAL_USER_ID", "default").strip() or "default"
    return SESSION_DIR / user / "signal_canvas"


def emit(obj: dict) -> None:
    print(json.dumps(obj, ensure_ascii=False), flush=True)


def emit_ok(data: dict | None = None) -> None:
    emit({"ok": True, "data": data or {}})


def emit_err(message: str) -> None:
    emit({"ok": False, "error": message})


def credentials() -> tuple[int, str]:
    api_id = os.environ.get("TELEGRAM_API_ID", "").strip()
    api_hash = os.environ.get("TELEGRAM_API_HASH", "").strip()
    if not api_id or not api_hash:
        emit_err("TELEGRAM_API_ID and TELEGRAM_API_HASH required")
        sys.exit(1)
    return int(api_id), api_hash


async def get_client():
    from telethon import TelegramClient

    SESSION_DIR.mkdir(parents=True, exist_ok=True)
    api_id, api_hash = credentials()
    path = session_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    return TelegramClient(str(path), api_id, api_hash)


async def cmd_status() -> None:
    client = await get_client()
    await client.connect()
    authorized = await client.is_user_authorized()
    me = None
    if authorized:
        user = await client.get_me()
        me = {
            "id": str(user.id),
            "username": user.username,
            "firstName": user.first_name,
            "phone": user.phone,
        }
    await client.disconnect()
    emit_ok({"authorized": authorized, "me": me, "sessionPath": str(session_path())})


async def cmd_send_code(phone: str) -> None:
    client = await get_client()
    await client.connect()
    result = await client.send_code_request(phone)
    await client.disconnect()
    emit_ok({"phoneCodeHash": result.phone_code_hash})


async def cmd_sign_in(phone: str, code: str, phone_code_hash: str) -> None:
    client = await get_client()
    await client.connect()
    await client.sign_in(phone=phone, code=code, phone_code_hash=phone_code_hash)
    user = await client.get_me()
    await client.disconnect()
    emit_ok(
        {
            "id": str(user.id),
            "username": user.username,
            "firstName": user.first_name,
            "phone": user.phone,
        }
    )


async def cmd_list_dialogs(limit: int) -> None:
    from telethon.tl.types import Channel, Chat, User

    client = await get_client()
    await client.connect()
    if not await client.is_user_authorized():
        await client.disconnect()
        emit_err("Not authorized — sign in first")
        return

    dialogs = []
    async for dialog in client.iter_dialogs(limit=limit):
        entity = dialog.entity
        kind = "unknown"
        username = getattr(entity, "username", None)
        if isinstance(entity, User):
            kind = "user"
        elif isinstance(entity, Chat):
            kind = "group"
        elif isinstance(entity, Channel):
            kind = "channel" if entity.broadcast else "supergroup"

        dialogs.append(
            {
                "id": str(dialog.id),
                "title": dialog.name or dialog.title or username or str(dialog.id),
                "username": username,
                "kind": kind,
                "unreadCount": dialog.unread_count,
            }
        )

    await client.disconnect()
    emit_ok({"dialogs": dialogs})


async def cmd_join(target: str) -> None:
    from telethon.tl.functions.messages import ImportChatInviteRequest
    from telethon.tl.functions.channels import JoinChannelRequest

    client = await get_client()
    await client.connect()
    if not await client.is_user_authorized():
        await client.disconnect()
        emit_err("Not authorized")
        return

    target = target.strip()
    if "joinchat/" in target or "t.me/+" in target:
        invite = target.split("+")[-1].split("/")[-1]
        updates = await client(ImportChatInviteRequest(invite))
        chat = updates.chats[0] if updates.chats else None
    else:
        username = target.replace("https://t.me/", "").replace("@", "").strip("/")
        chat = await client.get_entity(username)
        await client(JoinChannelRequest(chat))

    await client.disconnect()
    emit_ok(
        {
            "id": str(chat.id),
            "title": getattr(chat, "title", None) or getattr(chat, "username", target),
            "username": getattr(chat, "username", None),
        }
    )


async def cmd_history(chat_id: str, limit: int) -> None:
    client = await get_client()
    await client.connect()
    if not await client.is_user_authorized():
        await client.disconnect()
        emit_err("Not authorized")
        return

    entity = await client.get_entity(int(chat_id))
    messages = []
    async for msg in client.iter_messages(entity, limit=limit):
        if not msg.message:
            continue
        sender = await msg.get_sender()
        sender_name = None
        sender_id = None
        if sender:
            sender_id = str(sender.id)
            sender_name = getattr(sender, "username", None) or getattr(sender, "first_name", None)
        messages.append(
            {
                "id": str(msg.id),
                "chatId": str(chat_id),
                "chatTitle": getattr(entity, "title", None) or getattr(entity, "username", chat_id),
                "senderId": sender_id,
                "senderName": sender_name,
                "text": msg.message,
                "observedAt": msg.date.isoformat() if msg.date else None,
            }
        )

    await client.disconnect()
    emit_ok({"messages": list(reversed(messages))})


async def cmd_monitor(chat_ids: list[str]) -> None:
    from telethon import events

    client = await get_client()
    await client.connect()
    if not await client.is_user_authorized():
        emit_err("Not authorized")
        return

    ids = [int(c) for c in chat_ids if c.strip()]
    emit({"event": "monitor_started", "chatIds": [str(i) for i in ids]})

    @client.on(events.NewMessage(chats=ids))
    async def handler(event):  # type: ignore[no-untyped-def]
        text = event.raw_text or ""
        if not text.strip():
            return
        chat = await event.get_chat()
        sender = await event.get_sender()
        emit(
            {
                "event": "message",
                "id": str(event.id),
                "chatId": str(event.chat_id),
                "chatTitle": getattr(chat, "title", None) or getattr(chat, "username", str(event.chat_id)),
                "senderId": str(sender.id) if sender else None,
                "senderName": (
                    getattr(sender, "username", None) or getattr(sender, "first_name", None) if sender else None
                ),
                "text": text,
                "observedAt": event.date.isoformat() if event.date else None,
            }
        )

    await client.run_until_disconnected()


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("status")
    p_code = sub.add_parser("send-code")
    p_code.add_argument("--phone", required=True)
    p_sign = sub.add_parser("sign-in")
    p_sign.add_argument("--phone", required=True)
    p_sign.add_argument("--code", required=True)
    p_sign.add_argument("--phone-code-hash", required=True)
    p_list = sub.add_parser("list-dialogs")
    p_list.add_argument("--limit", type=int, default=50)
    p_join = sub.add_parser("join")
    p_join.add_argument("--target", required=True)
    p_hist = sub.add_parser("history")
    p_hist.add_argument("--chat-id", required=True)
    p_hist.add_argument("--limit", type=int, default=40)
    p_mon = sub.add_parser("monitor")
    p_mon.add_argument("--chat-ids", required=True, help="Comma-separated chat ids")

    args = parser.parse_args()

    async def run() -> None:
        if args.cmd == "status":
            await cmd_status()
        elif args.cmd == "send-code":
            await cmd_send_code(args.phone)
        elif args.cmd == "sign-in":
            await cmd_sign_in(args.phone, args.code, args.phone_code_hash)
        elif args.cmd == "list-dialogs":
            await cmd_list_dialogs(args.limit)
        elif args.cmd == "join":
            await cmd_join(args.target)
        elif args.cmd == "history":
            await cmd_history(args.chat_id, args.limit)
        elif args.cmd == "monitor":
            ids = [x.strip() for x in args.chat_ids.split(",") if x.strip()]
            await cmd_monitor(ids)

    asyncio.run(run())


if __name__ == "__main__":
    main()
