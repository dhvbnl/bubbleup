import io
import base64
import qrcode


def generate_qr_code(data: str) -> str:
    """
    Generate a QR code and return it as a base64-encoded PNG image
    
    Args:
        data: The URL or text to encode in the QR code
    
    Returns:
        Base64-encoded PNG image string
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode()
