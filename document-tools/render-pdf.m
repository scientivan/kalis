#import <AppKit/AppKit.h>
#import <CoreText/CoreText.h>
#import <PDFKit/PDFKit.h>
void draw(CGContextRef ctx, NSString *text, CGRect rect, CGFloat size, BOOL bold) {
 NSDictionary *attrs=@{NSFontAttributeName:[NSFont fontWithName:bold?@"Helvetica-Bold":@"Helvetica" size:size], NSForegroundColorAttributeName:NSColor.blackColor};
 NSAttributedString *s=[[NSAttributedString alloc] initWithString:text attributes:attrs];
 CTFramesetterRef setter=CTFramesetterCreateWithAttributedString((CFAttributedStringRef)s);
 CGPathRef path=CGPathCreateWithRect(rect,NULL);
 CTFrameRef frame=CTFramesetterCreateFrame(setter,CFRangeMake(0,0),path,NULL);
 CFRange visible=CTFrameGetVisibleStringRange(frame);
 if(visible.length<s.length){fprintf(stderr,"Overflow %ld/%lu\n",visible.length,(unsigned long)s.length);exit(2);}
 CTFrameDraw(frame,ctx);CFRelease(frame);CFRelease(setter);CGPathRelease(path);
}
int main(int argc,char **argv){@autoreleasepool {
 NSArray *pages=[NSJSONSerialization JSONObjectWithData:[NSData dataWithContentsOfFile:[NSString stringWithUTF8String:argv[2]]] options:0 error:nil];
 NSURL *url=[NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[1]]];
 CGRect box=CGRectMake(0,0,595.28,841.89);
 CGContextRef ctx=CGPDFContextCreateWithURL((CFURLRef)url,&box,NULL);
 int i=0;
 for(NSArray *p in pages){CGPDFContextBeginPage(ctx,NULL);
 draw(ctx,p[0],CGRectMake(42,774,511,35),15,YES);
 draw(ctx,p[1],CGRectMake(42,52,511,714),10.4,NO);
 draw(ctx,[NSString stringWithFormat:@"Rancangan hasil sesi | 12 November 2026 | %d / %lu",++i,(unsigned long)pages.count],CGRectMake(42,22,511,18),8,NO);
 CGPDFContextEndPage(ctx);}
 CGPDFContextClose(ctx);CGContextRelease(ctx);
 PDFDocument *doc=[[PDFDocument alloc] initWithURL:url];
 if(doc.pageCount!=pages.count)return 3;
 [doc.string writeToFile:@"/tmp/near-product-pdf-extracted.txt" atomically:YES encoding:NSUTF8StringEncoding error:nil];
 NSImage *im=[[doc pageAtIndex:0] thumbnailOfSize:NSMakeSize(900,1273) forBox:kPDFDisplayBoxMediaBox];
 NSBitmapImageRep *rep=[NSBitmapImageRep imageRepWithData:im.TIFFRepresentation];
 [[rep representationUsingType:NSBitmapImageFileTypePNG properties:@{}] writeToFile:@"/tmp/near-product-pdf-preview.png" atomically:YES];
 printf("Verified %lu pages, %lu characters, no overflow\n",(unsigned long)doc.pageCount,(unsigned long)doc.string.length);
}return 0;}
