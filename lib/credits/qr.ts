import QRCode from 'qrcode';

export async function claimQrSvg(url: string): Promise<string> {
	return QRCode.toString(url, {
		type: 'svg',
		margin: 1,
		errorCorrectionLevel: 'M',
		width: 320,
		color: {
			dark: '#26251e',
			light: '#00000000',
		},
	});
}
