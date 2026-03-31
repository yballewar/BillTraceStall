using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace BillTraceStall.API.Services;

public static class InvoicePdf
{
    public sealed record InvoiceHeader(
        string StallName,
        string StallCode,
        string OfficeName,
        string OfficePhone,
        string PeriodLabel
    );

    public sealed record InvoiceItemRow(
        string ItemName,
        string Category,
        int Quantity,
        decimal Amount
    );

    public sealed record InvoiceTotals(
        int TotalOrders,
        int TotalQty,
        decimal TotalAmount
    );

    public static byte[] Render(InvoiceHeader header, IReadOnlyList<InvoiceItemRow> items, InvoiceTotals totals)
    {
        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text("Invoice").FontSize(18).SemiBold();
                    col.Item().Text($"{header.StallName} ({header.StallCode})").SemiBold();
                    col.Item().Text($"Office: {header.OfficeName} • {header.OfficePhone}");
                    col.Item().Text($"Period: {header.PeriodLabel}");
                });

                page.Content().PaddingTop(16).Column(col =>
                {
                    col.Item().Text("Summary").FontSize(12).SemiBold();
                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Text($"Orders: {totals.TotalOrders}");
                        r.RelativeItem().Text($"Qty: {totals.TotalQty}");
                        r.RelativeItem().AlignRight().Text($"Amount: {totals.TotalAmount:0.##}").SemiBold();
                    });

                    col.Item().PaddingTop(12).Text("Items").FontSize(12).SemiBold();

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(4);
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(3);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Element(HeaderCell).Text("Item");
                            h.Cell().Element(HeaderCell).Text("Category");
                            h.Cell().Element(HeaderCell).AlignRight().Text("Qty");
                            h.Cell().Element(HeaderCell).AlignRight().Text("Amount");
                        });

                        foreach (var i in items)
                        {
                            table.Cell().Element(BodyCell).Text(i.ItemName);
                            table.Cell().Element(BodyCell).Text(i.Category);
                            table.Cell().Element(BodyCell).AlignRight().Text(i.Quantity.ToString());
                            table.Cell().Element(BodyCell).AlignRight().Text($"{i.Amount:0.##}");
                        }
                    });
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Generated ").FontColor(Colors.Grey.Medium);
                    x.Span(DateTimeOffset.UtcNow.ToString("yyyy-MM-dd HH:mm")).FontColor(Colors.Grey.Medium);
                });
            });
        });

        return doc.GeneratePdf();
    }

    private static IContainer HeaderCell(IContainer container)
    {
        return container
            .DefaultTextStyle(x => x.SemiBold())
            .PaddingVertical(6)
            .PaddingHorizontal(6)
            .Background(Colors.Grey.Lighten3)
            .BorderBottom(1)
            .BorderColor(Colors.Grey.Lighten1);
    }

    private static IContainer BodyCell(IContainer container)
    {
        return container
            .PaddingVertical(6)
            .PaddingHorizontal(6)
            .BorderBottom(1)
            .BorderColor(Colors.Grey.Lighten3);
    }
}

