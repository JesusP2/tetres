import { EmailTemplate } from "@daveyplate/better-auth-ui/server";

export const forgotPasswordTemplate = (url: string, BASE_URL: string) =>
	EmailTemplate({
		action: "Reset password",
		heading: "Reset password",
		siteName: "Omokage",
		imageUrl: BASE_URL + "/favicon.svg",
		baseUrl: BASE_URL,
		url: url,
		content: (
			<>
				<p>Hello,</p>
				<p>
					We received a password reset request for your account. If you
					initiated this request, please use the following link to securely
					access your account:
				</p>
			</>
		),
	});

