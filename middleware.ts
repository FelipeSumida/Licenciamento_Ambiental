import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const logado = req.cookies.get("cap-auth")?.value === "logado"
  const pathname = req.nextUrl.pathname

  const rotaLogin = pathname.startsWith("/login")
  const rotaApi = pathname.startsWith("/api")
  const rotaArquivos =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")

  if (rotaLogin || rotaApi || rotaArquivos) {
    return NextResponse.next()
  }

  if (!logado) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}