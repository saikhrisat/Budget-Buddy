
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, AlertTriangle, UploadCloud, Wand2, Eye } from 'lucide-react'; // Added Eye
import * as pdfjsLib from 'pdfjs-dist';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Define the ParsedTransaction interface
interface ParsedTransaction {
  rawDate?: string;
  rawTime?: string;
  parsedFullDate?: string; // Formatted date string for display
  transactionDetailsRaw?: string[]; // All lines making up the "Transaction Details" column for this entry
  transactionParty?: string; // Extracted "Paid to / Received from ..."
  transactionId?: string;    // Extracted "Transaction ID ..."
  utrNo?: string;            // Extracted "UTR No ..."
  paidBy?: string;           // Extracted "Paid by ..."
  type?: 'CREDIT' | 'DEBIT' | 'UNKNOWN';
  amount?: number;
  currency?: string;
}

export default function ImportTransactionsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      try {
        const workerUrl = new URL('/pdf.worker.js', window.location.origin);
        console.log('Setting PDF worker URL to:', workerUrl.href);
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.href;
      } catch (e) {
        console.error("Error constructing PDF worker URL:", e);
        // Fallback for environments where new URL() might fail with relative paths or specific origins
        // This is unlikely to be the primary issue but provides a fallback.
        const fallbackWorkerPath = '/pdf.worker.js';
        console.log('Falling back to PDF worker path:', fallbackWorkerPath);
        pdfjsLib.GlobalWorkerOptions.workerSrc = fallbackWorkerPath;
      }
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
        setExtractedText(""); 
        setParsedTransactions([]); // Clear previous parsed data
      } else {
        setError("Invalid file type. Please upload a PDF file.");
        setFile(null);
        setParsedTransactions([]);
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleExtractText = useCallback(async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      toast({
        title: "No File Selected",
        description: "Please select a PDF file to extract text.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedText("");
    setParsedTransactions([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join("\n"); // Join with newline to preserve line breaks better
        fullText += pageText + "\n\n"; 
      }
      
      setExtractedText(fullText.trim());
      if (fullText.trim().length === 0) {
        toast({
            title: "No Text Found",
            description: "The PDF might be image-based or password-protected without text content.",
            variant: "default"
        });
      } else {
        toast({
            title: "Text Extracted Successfully",
            description: "Review the text below. You can now try to parse it or process it with AI.",
        });
      }
    } catch (err: any) {
      console.error("Error extracting PDF text:", err);
      setError(`Failed to process PDF: ${err.message || 'Unknown error'}. The PDF might be corrupted or password-protected.`);
      toast({
        title: "PDF Processing Error",
        description: `Failed to process PDF: ${err.message || 'Unknown error'}.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [file, toast]);

  // Main Parsing Logic Function
  const parseBankStatementText = (text: string): ParsedTransaction[] => {
    const lines = text.split('\n').map(line => line.trim()); // Keep empty lines initially for block structure
    const parsedTxs: ParsedTransaction[] = [];

    const dateRegex = /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})\b/i;
    const timeRegex = /(\d{1,2}:\d{2}\s+(?:AM|PM))/i;
    const partyRegex = /(?:Paid to|Received from)\s*[:\-\s]*(.+)/i;
    const transIdRegex = /Transaction ID\s*[:\-\s]*(\S+)/i;
    const utrRegex = /UTR No\s*[:\-\s]*(\S+)/i;
    const paidByRegex = /Paid by\s*[:\-\s]*(.+)/i;
    const typeRegex = /\b(CREDIT|DEBIT)\b/i;
    const amountRegex = /(₹)\s*([\d,]+\.?\d*)/;

    let currentTransactionBlock: string[] = [];
    let processingTransaction = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if the line contains a date - potential start of a transaction row
        if (dateRegex.test(line)) {
            // If we were processing a transaction, finalize it
            if (processingTransaction && currentTransactionBlock.length > 0) {
                const parsed = processTransactionBlock(currentTransactionBlock, dateRegex, timeRegex, partyRegex, transIdRegex, utrRegex, paidByRegex, typeRegex, amountRegex);
                if (parsed.rawDate) parsedTxs.push(parsed); // Add if valid
            }
            currentTransactionBlock = [line]; // Start new block with the date line
            processingTransaction = true;
        } else if (processingTransaction) {
            // If it's not a new date, and we are in a transaction, add line to current block
            currentTransactionBlock.push(line);

            // Heuristic: If we see DEBIT/CREDIT and an Amount on the same or subsequent lines,
            // it's a strong indicator this block might be ending soon or is a complete row.
            // This part is tricky because "Transaction Details" is multi-line.
            // For now, we collect lines until the next date.
        }
    }
    // Process the last transaction block
    if (processingTransaction && currentTransactionBlock.length > 0) {
        const parsed = processTransactionBlock(currentTransactionBlock, dateRegex, timeRegex, partyRegex, transIdRegex, utrRegex, paidByRegex, typeRegex, amountRegex);
        if (parsed.rawDate) parsedTxs.push(parsed);
    }
    
    return parsedTxs;
  };

  const processTransactionBlock = (
        blockLines: string[],
        dateRegex: RegExp, timeRegex: RegExp, partyRegex: RegExp, transIdRegex: RegExp, 
        utrRegex: RegExp, paidByRegex: RegExp, typeRegex: RegExp, amountRegex: RegExp
    ): ParsedTransaction => {
        
    let transaction: ParsedTransaction = { transactionDetailsRaw: [], type: 'UNKNOWN' };
    let detailsCollector: string[] = [];

    for (let j = 0; j < blockLines.length; j++) {
        const lineContent = blockLines[j];
        if (!lineContent && j > 0 && j < blockLines.length -1) { // Preserve internal empty lines for context
            detailsCollector.push(""); 
            continue;
        }
        if (!lineContent) continue; // Skip empty lines at start/end of block

        // Date
        const dateMatch = lineContent.match(dateRegex);
        if (dateMatch && !transaction.rawDate) {
            transaction.rawDate = dateMatch[0];
            // Check next line for time if this is the date line
            if (j + 1 < blockLines.length) {
                const timeMatch = blockLines[j+1].match(timeRegex);
                if (timeMatch) {
                    transaction.rawTime = timeMatch[0];
                    j++; // Consume time line
                }
            }
            continue; // Move to next line after processing date (and possibly time)
        }
        
        // Try to match other fields
        const partyM = lineContent.match(partyRegex);
        if (partyM) { transaction.transactionParty = partyM[1].trim(); detailsCollector.push(lineContent); continue; }

        const transIdM = lineContent.match(transIdRegex);
        if (transIdM) { transaction.transactionId = transIdM[1].trim(); detailsCollector.push(lineContent); continue; }
        
        const utrM = lineContent.match(utrRegex);
        if (utrM) { transaction.utrNo = utrM[1].trim(); detailsCollector.push(lineContent); continue; }

        const paidByM = lineContent.match(paidByRegex);
        if (paidByM) { transaction.paidBy = paidByM[1].trim(); detailsCollector.push(lineContent); continue; }

        const typeM = lineContent.match(typeRegex);
        if (typeM) { transaction.type = typeM[0].toUpperCase() as 'CREDIT' | 'DEBIT'; } // Don't continue, might be on same line as amount

        const amountM = lineContent.match(amountRegex);
        if (amountM) {
            transaction.currency = amountM[1];
            transaction.amount = parseFloat(amountM[2].replace(/,/g, ''));
        }
        
        // If not a structural element recognized above, add to detailsCollector unless it was already added.
        if (!partyM && !transIdM && !utrM && !paidByM) {
          // Avoid re-adding line if it contained type/amount but was not one of the primary detail lines
          let wasTypeOrAmountLine = false;
          if (typeM || amountM) wasTypeOrAmountLine = true;
          
          if (!wasTypeOrAmountLine || (typeM && !amountM) || (!typeM && amountM)){ // Add if it's purely detail or only one of type/amount
             detailsCollector.push(lineContent);
          } else if (!typeM && !amountM) { // only if it's not type AND not amount line
             detailsCollector.push(lineContent);
          }
        }
    }

    transaction.transactionDetailsRaw = detailsCollector;

    if (transaction.rawDate && transaction.rawTime) {
        try {
            const d = new Date(`${transaction.rawDate} ${transaction.rawTime}`);
            transaction.parsedFullDate = d.toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
        } catch (e) { 
            transaction.parsedFullDate = `${transaction.rawDate} ${transaction.rawTime}`;
        }
    } else if (transaction.rawDate) {
        try {
            const d = new Date(transaction.rawDate);
            transaction.parsedFullDate = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch(e) {
            transaction.parsedFullDate = transaction.rawDate;
        }
    }
    return transaction;
  };


  const handleParseExtractedText = () => {
    if (!extractedText) {
      toast({
        title: "No Text to Parse",
        description: "Please extract text from a PDF first.",
        variant: "destructive",
      });
      return;
    }
    setIsParsing(true);
    setParsedTransactions([]);

    // Simulate parsing delay for UX
    setTimeout(() => {
      const parsed = parseBankStatementText(extractedText);
      setParsedTransactions(parsed);
      setIsParsing(false);
      if (parsed.length > 0) {
        toast({
          title: "Parsing Attempt Complete",
          description: `Found ${parsed.length} potential transaction entries. Please review the table.`,
        });
      } else {
        toast({
          title: "No Transactions Identified",
          description: "Could not identify distinct transaction entries based on the expected date pattern. The PDF structure might be different or text extraction quality is low.",
          variant: "default",
          duration: 7000,
        });
      }
    }, 500);
  };

  const handleProcessWithAI = () => {
    if (parsedTransactions.length === 0 && !extractedText) {
        toast({
            title: "No Data to Process",
            description: "Please extract text from a PDF and optionally parse it first.",
            variant: "destructive"
        });
        return;
    }
     const dataToSendToAI = parsedTransactions.length > 0 
        ? JSON.stringify(parsedTransactions, null, 2) // Send structured if available
        : extractedText; // Send raw text otherwise

    toast({
      title: "AI Processing (Placeholder)",
      description: "This is where you would send the data to a Genkit flow for structuring and importing.",
    });
    console.log("Data for AI Processing:", dataToSendToAI);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 to-background p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm" className="mb-4 hover:bg-muted/50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <div className="bg-card p-6 rounded-xl shadow-xl border border-border/50">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-1 flex items-center">
            <UploadCloud className="mr-3 h-8 w-8" /> Import Transactions from PDF
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload your bank statement (PDF) to extract transaction data.
          </p>
        </div>
      </header>

      <Card className="shadow-xl border border-border/50">
        <CardHeader>
          <CardTitle>Step 1: Upload PDF Statement</CardTitle>
          <CardDescription>
            Select a PDF file. Text extraction works best with text-based PDFs. Scanned images won't work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pdf-upload" className="text-base font-medium">Choose PDF File</Label>
            <Input 
              id="pdf-upload" 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange} 
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {error && (
              <p className="text-sm text-destructive flex items-center mt-2">
                <AlertTriangle className="h-4 w-4 mr-1" /> {error}
              </p>
            )}
          </div>

          <Button 
            onClick={handleExtractText} 
            disabled={isLoading || !file}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting...</>
            ) : (
              <><FileText className="mr-2 h-4 w-4" /> Extract Text from PDF</>
            )}
          </Button>
        </CardContent>
      </Card>

      {extractedText && (
        <Card className="mt-8 shadow-xl border border-border/50">
          <CardHeader>
            <CardTitle>Step 2: Review & Parse Extracted Text</CardTitle>
            <CardDescription>
              Below is the raw text from your PDF. You can manually parse it or use the "Parse Extracted Text" button for an automated attempt based on common bank statement structures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={extractedText}
              readOnly
              placeholder="Extracted text will appear here..."
              className="min-h-[200px] max-h-[40vh] text-xs bg-muted/30 font-mono"
              aria-label="Extracted text from PDF"
            />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-start">
            <Button 
              onClick={handleParseExtractedText} 
              disabled={isParsing || !extractedText}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {isParsing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing...</>
              ) : (
                <><Eye className="mr-2 h-4 w-4" /> Parse Extracted Text (Preview)</>
              )}
            </Button>
            <Button 
              onClick={handleProcessWithAI} 
              disabled={isLoading || isParsing} 
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Wand2 className="mr-2 h-4 w-4" /> Process with AI (Placeholder)
            </Button>
          </CardFooter>
        </Card>
      )}

      {parsedTransactions.length > 0 && (
        <Card className="mt-8 shadow-xl border border-border/50">
          <CardHeader>
            <CardTitle>Step 3: Parsed Transaction Preview</CardTitle>
            <CardDescription>Review the extracted transactions. Accuracy depends on PDF structure and text extraction quality. This is for verification only.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Date & Time</TableHead>
                    <TableHead>Transaction Party</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>UTR No.</TableHead>
                    <TableHead>Paid By</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Raw Details Lines</TableHead> 
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedTransactions.map((txn, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs whitespace-nowrap">{txn.parsedFullDate || txn.rawDate || 'N/A'}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs" title={txn.transactionParty}>{txn.transactionParty || '-'}</TableCell>
                      <TableCell className="text-xs">{txn.transactionId || '-'}</TableCell>
                      <TableCell className="text-xs">{txn.utrNo || '-'}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs" title={txn.paidBy}>{txn.paidBy || '-'}</TableCell>
                      <TableCell className={cn("text-xs font-medium", txn.type === 'CREDIT' ? 'text-green-600' : txn.type === 'DEBIT' ? 'text-red-600' : '')}>
                        {txn.type || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold">{txn.currency}{txn.amount?.toFixed(2) || '-'}</TableCell>
                       <TableCell className="text-[10px] text-muted-foreground max-w-[200px] truncate" title={txn.transactionDetailsRaw?.join('\n') || ''}>
                        {txn.transactionDetailsRaw?.slice(0,3).join('; ') || '-'}
                        {(txn.transactionDetailsRaw?.length || 0) > 3 ? '...' : ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

