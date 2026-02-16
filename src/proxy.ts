import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard(.*)",
    "/leads(.*)",
    "/funnel(.*)",
    "/clients(.*)",
    "/projects(.*)",
    "/calendar(.*)",
    "/finance(.*)",
    "/settings(.*)",
    "/proposals", // Protege a listagem
    "/proposals/templates(.*)", // Protege templates
    // Não incluímos /proposals/view aqui para que seja público
  ],
};

