import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BUDGET_STATUS, normalizeStatus } from './statusConstants';

// Helper: Converter Hex para RGB
const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

// Helper: Carregar Imagem como Elemento HTML (Melhor para Transparência no jsPDF)
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      resolve({
        element: img,
        width: img.width,
        height: img.height,
        format: url.toLowerCase().includes('.png') ? 'PNG' : 'JPEG'
      });
    };
    img.onerror = () => reject("Erro ao carregar a imagem do servidor");
    img.src = url;
  });
};

const getContainSize = (imgW, imgH, containerW, containerH) => {
  const ratio = Math.min(containerW / imgW, containerH / imgH);
  return { w: imgW * ratio, h: imgH * ratio };
};

// Mapeamento de cores por status do serviço (Sincronizado com statusConstants.js)
const getStatusColor = (status) => {
  const key = normalizeStatus(status);
  const info = BUDGET_STATUS[key] || BUDGET_STATUS.em_aberto;
  
  return { 
    main: hexToRgb(info.color), 
    light: hexToRgb(info.color).map(v => Math.min(255, v + 150)) // Versão clara para detalhes
  };
};

export const generateOrcamentoPDF = async (orcamento, config) => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const safeWidth = pageWidth - (margin * 2);

  const tipoDoc = orcamento.tipo_documento || 'ORÇAMENTO';
  const statusColor = getStatusColor(orcamento.status_servico);

  // --- 0. MARCA D'ÁGUA (BACKGROUND) ---
  try {
    if (config?.logo_url) {
      const logo = await loadImage(`https://appgestor-lgaj.onrender.com${config.logo_url}`);
      const watermarkW = pageWidth * 0.80; // 80% da largura
      const watermarkH = (logo.height / logo.width) * watermarkW;
      
      // Posicionada mais para baixo, mas centralizada horizontalmente
      const x = (pageWidth - watermarkW) / 2;
      // Garantir que não passe do rodapé (margem inferior de 20mm)
      const y = Math.min(pageHeight * 0.45, pageHeight - watermarkH - 20); 

      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.30 })); // 30% de opacidade
      doc.addImage(logo.element, logo.format, x, y, watermarkW, watermarkH, undefined, 'FAST');
      doc.restoreGraphicsState();
    }
  } catch (e) { console.warn("Erro ao desenhar marca d'água:", e); }

  // Paleta Premium com cor dinâmica de status
  const colors = {
    navy: [15, 23, 42],       // #0F172A - Deep Navy
    accent: statusColor.main, 
    lightAccent: statusColor.light,
    bgLight: [243, 244, 246], // #F3F4F6 - Light Grey Background Card
    textDark: [15, 23, 42],
    textMuted: [107, 114, 128],
    white: [255, 255, 255],
    border: [209, 213, 219]
  };

  // --- 1. HEADER (Design Premium Navy) ---
  const headerHeight = 55; // Mm
  doc.setFillColor(...colors.navy);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Faixa decorativa diagonal accent (Reflete a cor do Status)
  doc.setFillColor(...colors.accent);
  doc.triangle(pageWidth - 80, 0, pageWidth, 0, pageWidth, headerHeight, 'F');
  doc.setFillColor(...colors.lightAccent);
  doc.triangle(pageWidth - 95, 0, pageWidth - 80, 0, pageWidth, headerHeight - 15, 'F');

  // --- LOGO ---
  try {
    if (config?.logo_url) {
      const logo = await loadImage(`https://appgestor-lgaj.onrender.com${config.logo_url}`);
      // Aumentando a altura máxima permitida para a logo no cabeçalho
      const logoSize = getContainSize(logo.width, logo.height, 80, 48);
      doc.addImage(
        logo.element, 
        logo.format, 
        margin, 
        (headerHeight - logoSize.h) / 2, 
        logoSize.w, 
        logoSize.h,
        undefined, 
        'FAST'
      );
    } else {
        doc.setTextColor(...colors.white);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(config?.nome_empresa || 'FRAGOSOS', margin, (headerHeight/2) + 5);
    }
  } catch (e) { console.warn("Erro ao carregar logo:", e); }

  // --- Título e Infos do Documento (Com Sombra para Visibilidade) ---
  const headerTextX = pageWidth - margin;
  const drawTextWithShadow = (text, x, y, size, isBold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    // Sombra (Preto suave deslocado)
    doc.setTextColor(0, 0, 0, 0.4);
    doc.text(text, x + 0.3, y + 0.3, { align: 'right' });
    // Texto Principal (Branco)
    doc.setTextColor(...colors.white);
    doc.text(text, x, y, { align: 'right' });
  };

  drawTextWithShadow(tipoDoc, headerTextX, 27, 28, true);
  drawTextWithShadow(`Número Documento: #${orcamento.numero_orcamento || '0000'}`, headerTextX, 36, 10.5);
  
  const dataTxt = orcamento.data_emissao ? orcamento.data_emissao.split('-').reverse().join('/') : new Date().toLocaleDateString();
  drawTextWithShadow(`Data de Emissão: ${dataTxt}`, headerTextX, 41, 10.5);

  let currentY = headerHeight + 12;

  // --- 2. CLIENTE E EMPRESA (LAYOUT 2 COLUNAS / CARD) ---
  const colWidth = (safeWidth / 2) - 10;
  const splitClientName = doc.splitTextToSize(orcamento.cliente_nome || 'Cliente não informado', colWidth);
  const splitClientAddr = doc.splitTextToSize(`Endereço: ${orcamento.cliente_endereco || '-'}`, colWidth);
  const splitCompanyName = doc.splitTextToSize(config?.nome_empresa || 'FRAGOSOS AR-CONDICIONADO', colWidth);

  // Altura dinâmica baseada no conteúdo
  const lineCountClient = splitClientName.length + splitClientAddr.length + 3;
  const lineCountCompany = splitCompanyName.length + 4;
  const dynamicCardHeight = Math.max(42, Math.max(lineCountClient, lineCountCompany) * 5 + 10);

  doc.setFillColor(...colors.bgLight);
  doc.roundedRect(margin, currentY, safeWidth, dynamicCardHeight, 2, 2, 'F');
  
  // Detalhe decorativo no card
  doc.setFillColor(...colors.accent);
  doc.rect(margin, currentY, 1.5, dynamicCardHeight, 'F');

  doc.setTextColor(...colors.accent);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:', margin + 6, currentY + 8);

  doc.setTextColor(...colors.textDark);
  doc.setFontSize(11);
  doc.text(splitClientName, margin + 6, currentY + 16);
  
  let clientY = currentY + 16 + (splitClientName.length * 5);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textMuted);
  doc.text(`Tel: ${orcamento.cliente_telefone || '-'}`, margin + 6, clientY);
  doc.text(splitClientAddr, margin + 6, clientY + 5);
  doc.text(`Doc: ${orcamento.cliente_cpf || '-'}`, margin + 6, clientY + 5 + (splitClientAddr.length * 4));

  const rightX = (pageWidth / 2) + 5;
  doc.setTextColor(...colors.accent);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DA EMPRESA:', rightX, currentY + 8);
  
  doc.setTextColor(...colors.textDark);
  doc.setFontSize(10.5);
  doc.text(splitCompanyName, rightX, currentY + 16);
  
  let companyY = currentY + 16 + (splitCompanyName.length * 5);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textMuted);
  doc.text(`WhatsApp: ${config?.telefone || '-'}`, rightX, companyY);
  doc.text(`Cidade: ${config?.cidade || 'Ji-Paraná - RO'}`, rightX, companyY + 5);
  doc.text(`E-mail: ${config?.email || '-'}`, rightX, companyY + 10);

  currentY += dynamicCardHeight + 10;

  // --- STATUS DE SERVIÇO (Destaque Centralizado) ---
  doc.setFillColor(...colors.accent);
  doc.rect(margin, currentY, safeWidth, 8, 'F');
  doc.setTextColor(...colors.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const statusTotalTxt = `STATUS DO SERVIÇO: ${orcamento.status_servico || 'PENDENTE'}`.toUpperCase();
  doc.text(statusTotalTxt, pageWidth / 2, currentY + 5.5, { align: 'center' });

  currentY += 14;

  // --- 3. TABELA DE ITENS (DESIGN PREMIUM) ---
  const combinedItems = [
    ...(orcamento.servicos || []).map((s, idx) => [
      idx + 1,
      s.observacao ? `${s.descricao}\n${s.observacao}` : s.descricao,
      `R$ ${Number(s.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${s.quantidade}${s.unidade_cobranca ? ` ${s.unidade_cobranca}` : ''}`,
      `R$ ${Number(s.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]),
    ...(orcamento.itens || []).map((m, idx) => [
      (orcamento.servicos?.length || 0) + idx + 1,
      `[Material] ${m.descricao}`,
      `R$ ${Number(m.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      m.quantidade,
      `R$ ${Number(m.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ])
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Nº', 'DESCRIÇÃO COMPLETA DOS SERVIÇOS E MATERIAIS', 'PREÇO UNIT.', 'QTD', 'TOTAL']],
    body: combinedItems.length > 0 ? combinedItems : [['-', 'Nenhum registro encontrado', '-', '-', '-']],
    theme: 'plain',
    headStyles: { fillColor: colors.navy, textColor: colors.white, fontSize: 8, cellPadding: 3.5, halign: 'center' },
    columnStyles: { 
      0: { halign: 'center', cellWidth: 10 }, 
      1: { halign: 'left' }, 
      2: { halign: 'right', cellWidth: 30 }, 
      3: { halign: 'center', cellWidth: 15 }, 
      4: { halign: 'right', cellWidth: 30 } 
    },
    styles: { fontSize: 8.5, cellPadding: 3.5, textColor: colors.textDark },
    didParseCell: (d) => {
       if (d.section === 'body' && d.row.index % 2 === 1) d.cell.styles.fillColor = [248, 249, 250];
    },
    didDrawCell: (d) => {
        if (d.section === 'body') {
           doc.setDrawColor(235, 237, 240); doc.setLineWidth(0.1);
           doc.line(d.cell.x, d.cell.y + d.cell.height, d.cell.x + d.cell.width, d.cell.y + d.cell.height);
        }
    },
    margin: { left: margin, right: margin }
  });

  currentY = doc.lastAutoTable.finalY + 12;

  // --- 4. RESUMO, DESCRIÇÃO E PAGAMENTO ---
  if (currentY > pageHeight - 80) { doc.addPage(); currentY = margin + 10; }

  if (orcamento.descricao_detalhada) {
      doc.setTextColor(...colors.accent);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIÇÃO TÉCNICA / OBSERVAÇÕES:', margin, currentY);
      doc.setTextColor(...colors.textDark);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const splitDesc = doc.splitTextToSize(orcamento.descricao_detalhada, (safeWidth * 0.6));
      doc.text(splitDesc, margin, currentY + 6);
  }

  const totalBoxW = 60;
  const totalBoxX = pageWidth - margin - totalBoxW;
  const totalBaseY = currentY;

  doc.setTextColor(...colors.textMuted);
  doc.setFontSize(9);
  doc.text('Subtotal:', totalBoxX, totalBaseY);
  const subVal = (Number(orcamento.total_servicos) || 0) + (Number(orcamento.total_materiais) || 0);
  doc.text(`R$ ${subVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin, totalBaseY, { align: 'right' });

  doc.text('Desconto:', totalBoxX, totalBaseY + 6);
  const descVal = Number(orcamento.desconto) || 0;
  doc.text(`- R$ ${descVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin, totalBaseY + 6, { align: 'right' });

  doc.setFillColor(...colors.accent);
  doc.rect(totalBoxX - 4, totalBaseY + 10, totalBoxW + 4, 12, 'F');
  doc.setTextColor(...colors.white);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL FINAL', totalBoxX, totalBaseY + 18);
  doc.text(`R$ ${Number(orcamento.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 2, totalBaseY + 18, { align: 'right' });

  doc.setTextColor(...colors.textDark);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const payY = totalBaseY + 30;
  doc.text('FORMA DE PAGAMENTO:', totalBoxX, payY);
  doc.setFont('helvetica', 'normal');
  doc.text(orcamento.forma_pagamento || 'Pix/Dinheiro', totalBoxX, payY + 5);

  currentY = Math.max(payY + 15, currentY + 35);

  // --- 5. ASSINATURA (CENTRALIZADA) ---
  if (currentY > pageHeight - 50) { doc.addPage(); currentY = margin + 25; }
  
  currentY += 30;
  const signW = 80; // Largura da linha
  const signX = (pageWidth - signW) / 2; // Centralizar horizontalmente

  doc.setDrawColor(...colors.border); 
  doc.setLineWidth(0.4);
  doc.line(signX, currentY, signX + signW, currentY);

  doc.setTextColor(...colors.textDark); 
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(orcamento.tecnico_responsavel || 'TÉCNICO RESPONSÁVEL', pageWidth / 2, currentY + 6, { align: 'center' });
  
  doc.setTextColor(...colors.textMuted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('TÉCNICO RESPONSÁVEL', pageWidth / 2, currentY + 11, { align: 'center' });

  // --- 6. RODAPÉ ---
  doc.setFillColor(...colors.navy);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  
  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const rodapeInfo = `${config?.telefone || ''} | ${config?.cidade || 'Ji-Paraná - RO'} | ${config?.email || ''}`;
  doc.text(rodapeInfo, pageWidth / 2, pageHeight - 7, { align: 'center' });

  doc.save(`${tipoDoc}_${orcamento.numero_orcamento || 'Proposta'}.pdf`);
};
