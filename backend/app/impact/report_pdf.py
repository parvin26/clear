"""Generate a simple A4 impact report PDF from profile and measurements."""
from datetime import datetime
from io import BytesIO
from typing import Any, Optional

from reportlab.lib import colors

# Human-readable names and units for indicator_template_id (match frontend INDICATOR_TEMPLATES)
INDICATOR_NAMES: dict[str, tuple[str, str]] = {
    "total_beneficiaries": ("Total beneficiaries", "people"),
    "active_beneficiaries": ("Active beneficiaries", "people"),
    "geographic_coverage": ("Geographic coverage", "locations"),
    "jobs_created_fte": ("Jobs created (FTE)", "FTE"),
    "people_trained": ("People trained", "people"),
    "income_generated_for_beneficiaries": ("Income generated for beneficiaries", "currency"),
    "students_educated": ("Students educated", "people"),
    "learning_hours_delivered": ("Learning hours delivered", "hours"),
    "people_with_healthcare_access": ("People with healthcare access", "people"),
    "nutrition_support_provided": ("Nutrition support provided", "people"),
    "co2_avoided": ("CO₂ avoided", "tCO2e"),
    "clean_energy_generated_or_access": ("Clean energy generated or access", "MWh or households"),
    "waste_diverted_from_landfill": ("Waste diverted from landfill", "tonnes"),
    "people_with_financial_services_access": ("People with financial services access", "people"),
    "savings_mobilized": ("Savings mobilized", "currency"),
    "pct_women_beneficiaries": ("% women beneficiaries", "%"),
    "pct_marginalized_group_beneficiaries": ("% marginalized group beneficiaries", "%"),
    "beneficiary_satisfaction_score": ("Beneficiary satisfaction score", "score 1-10"),
    "repeat_beneficiaries_pct": ("Repeat beneficiaries %", "%"),
    "income_change_for_beneficiaries_pct": ("Income change for beneficiaries %", "%"),
}
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak


def _status_label(pct: Optional[float], target: Optional[float]) -> str:
    if target is None or target <= 0 or pct is None:
        return "—"
    if pct >= 80:
        return "On track"
    if pct >= 50:
        return "At risk"
    return "Off track"


def build_impact_report_pdf(
    org_name: str,
    country: str,
    sector: str,
    period_label: str,
    primary_sdg_tags: list[str],
    indicators: list[dict[str, Any]],
    total_beneficiaries: Optional[float] = None,
) -> bytes:
    """Build PDF bytes for impact report. indicators: list of {name, unit, latest_value, target_value, target_year, status}."""
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=inch,
        bottomMargin=inch,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontSize=18,
        spaceAfter=12,
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=12,
        spaceAfter=6,
    )
    body = []

    # Header
    body.append(Paragraph("CLEAR Impact Report", title_style))
    body.append(Paragraph(f"<b>Organization:</b> {org_name or '—'}", styles["Normal"]))
    body.append(Paragraph(f"<b>Country:</b> {country or '—'} &emsp; <b>Sector:</b> {sector or '—'}", styles["Normal"]))
    body.append(Paragraph(f"<b>Reporting period:</b> {period_label}", styles["Normal"]))
    body.append(Spacer(1, 0.3 * inch))

    # Summary
    body.append(Paragraph("Summary", heading_style))
    if total_beneficiaries is not None:
        body.append(Paragraph(f"Total beneficiaries: {total_beneficiaries:,.0f}", styles["Normal"]))
    body.append(Spacer(1, 0.2 * inch))

    # Key metrics table
    body.append(Paragraph("Key metrics", heading_style))
    table_data = [["Indicator", "Latest value", "Target", "Status"]]
    for ind in indicators:
        name = ind.get("name") or ind.get("indicator_template_id", "")
        unit = ind.get("unit", "")
        latest = ind.get("latest_value")
        target = ind.get("target_value")
        target_year = ind.get("target_year")
        target_str = f"{target:,.2f} {unit}" if target is not None else "—"
        if target_year:
            target_str += f" ({target_year})"
        latest_str = f"{latest:,.2f} {unit}" if latest is not None else "—"
        pct = (100 * latest / target) if (target and target > 0 and latest is not None) else None
        status = _status_label(pct, target)
        table_data.append([name, latest_str, target_str, status])
    t = Table(table_data, colWidths=[2.2 * inch, 1.5 * inch, 1.5 * inch, 1 * inch])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e0e0e0")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ]
        )
    )
    body.append(t)
    body.append(Spacer(1, 0.3 * inch))

    # SDG tags
    if primary_sdg_tags:
        body.append(Paragraph("SDG alignment", heading_style))
        body.append(Paragraph(", ".join(primary_sdg_tags), styles["Normal"]))
        body.append(Spacer(1, 0.2 * inch))

    body.append(Paragraph(f"Generated by CLEAR on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]))

    doc.build(body)
    return buf.getvalue()
