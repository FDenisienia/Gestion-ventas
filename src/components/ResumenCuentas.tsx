import { useState, useEffect, useMemo, memo } from 'react';
import { Container, Card, Table, Row, Col, Badge, Form, Button, ButtonGroup } from 'react-bootstrap';
import { obtenerVentas } from '../utils/storage';
import type { Venta } from '../types/venta';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function ResumenCuentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  
  // Calcular fechas por defecto (últimos 30 días)
  const getDefaultDates = () => {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 29); // Incluir hoy + 29 días anteriores = 30 días
    
    return {
      inicio: hace30Dias.toISOString().split('T')[0],
      fin: hoy.toISOString().split('T')[0],
    };
  };
  
  const [fechaInicio, setFechaInicio] = useState<string>(getDefaultDates().inicio);
  const [fechaFin, setFechaFin] = useState<string>(getDefaultDates().fin);

  useEffect(() => {
    cargarVentas();
    
    const handleStorageChange = () => {
      cargarVentas();
    };
    
    window.addEventListener('ventasActualizadas', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('ventasActualizadas', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const cargarVentas = async () => {
    try {
      const ventasGuardadas = await obtenerVentas();
      setVentas(ventasGuardadas);
    } catch (error: any) {
      // Solo mostrar error si no es un error de conexión común
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error al cargar ventas:', error);
      }
    }
  };

  const establecerRangoFechas = (dias: number) => {
    const hoy = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - (dias - 1)); // -1 para incluir hoy
    
    setFechaInicio(fechaInicio.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  };

  // Calcular resumen de cuentas
  const resumen = useMemo(() => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999); // Incluir todo el día final
    
    // Filtrar ventas por rango de fechas
    const ventasEnRango = ventas.filter((venta) => {
      const fechaVenta = new Date(venta.fecha);
      return fechaVenta >= inicio && fechaVenta <= fin;
    });
    
    // Filtrar ventas por rango de fechas y estado pagado
    const ventasPagadas = ventasEnRango.filter((venta) => {
      return venta.estadoPago === 'pagado';
    });
    
    // Filtrar ventas que NO están pendientes (solo pagadas y parcialmente pagadas)
    // Las ventas pendientes NO se reflejan en las ganancias
    const ventasNoPendientes = ventasEnRango.filter((venta) => {
      return venta.estadoPago !== 'pendiente';
    });
    
    // Calcular ganancia bruta (ventas pagadas + parcialmente pagadas, EXCLUYENDO pendientes)
    const gananciaBruta = ventasNoPendientes.reduce((sum, venta) => sum + venta.ganancia, 0);
    
    // Calcular ganancia neta (solo ventas completamente pagadas)
    const gananciaNeta = ventasPagadas.reduce((sum, venta) => sum + venta.ganancia, 0);
    
    // Calcular ganancias por categoría
    const gananciaBrutaPorCategoria: { [key: string]: number } = {};
    const gananciaNetaPorCategoria: { [key: string]: number } = {};
    
    // Solo incluir ventas no pendientes en ganancia bruta
    ventasNoPendientes.forEach((venta) => {
      const categoria = venta.categoria || 'Sin categoría';
      if (!gananciaBrutaPorCategoria[categoria]) {
        gananciaBrutaPorCategoria[categoria] = 0;
      }
      gananciaBrutaPorCategoria[categoria] += venta.ganancia;
    });
    
    // Solo ventas pagadas en ganancia neta
    ventasPagadas.forEach((venta) => {
      const categoria = venta.categoria || 'Sin categoría';
      if (!gananciaNetaPorCategoria[categoria]) {
        gananciaNetaPorCategoria[categoria] = 0;
      }
      gananciaNetaPorCategoria[categoria] += venta.ganancia;
    });
    
    let totalEfectivo = 0;
    let totalTransferencias = 0;
    const transferenciasPorCuenta: { [key: string]: number } = {};

    ventasPagadas.forEach((venta) => {
      const totalVenta = venta.precioVenta * venta.cantidad;
      
      if (venta.metodoPago === 'efectivo') {
        totalEfectivo += totalVenta;
      } else if (venta.metodoPago === 'transferencia') {
        totalTransferencias += totalVenta;
        const cuenta = venta.cuentaBanco || 'Sin especificar';
        if (!transferenciasPorCuenta[cuenta]) {
          transferenciasPorCuenta[cuenta] = 0;
        }
        transferenciasPorCuenta[cuenta] += totalVenta;
      }
    });

    return {
      totalEfectivo,
      totalTransferencias,
      transferenciasPorCuenta,
      totalGeneral: totalEfectivo + totalTransferencias,
      gananciaBruta,
      gananciaNeta,
      gananciaBrutaPorCategoria,
      gananciaNetaPorCategoria,
    };
  }, [ventas, fechaInicio, fechaFin]);

  const ventasSinMetodoPago = useMemo(() => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);
    
    return ventas.filter((venta) => {
      if (venta.estadoPago !== 'pagado' || venta.metodoPago) return false;
      const fechaVenta = new Date(venta.fecha);
      return fechaVenta >= inicio && fechaVenta <= fin;
    });
  }, [ventas, fechaInicio, fechaFin]);
  
  const formatearRangoFechas = () => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    return `${inicio.toLocaleDateString('es-ES')} - ${fin.toLocaleDateString('es-ES')}`;
  };

  const exportarResumen = () => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    // Calcular días entre fechas para determinar si es semana o mes
    const dias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const tipoPeriodo = dias <= 7 ? 'Semana' : dias <= 31 ? 'Mes' : 'Periodo';

    // Crear PDF
    const doc = new jsPDF();
    const margin = 14;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen de Cuentas - TradeFlowImports', margin, 20);

    // Información del período
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${tipoPeriodo}`, margin, 30);
    doc.text(`Rango: ${formatearRangoFechas()}`, margin, 36);
    doc.text(`Fecha de Exportación: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, margin, 42);

    let startY = 50;

    // Título: Resumen General
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN GENERAL', margin, startY);
    startY += 8;

    // Tabla: Resumen General
    autoTable(doc, {
      startY: startY,
      head: [['Concepto', 'Monto']],
      body: [
        ['Total Efectivo (Caja)', `$${resumen.totalEfectivo.toFixed(2)}`],
        ['Total Transferencias', `$${resumen.totalTransferencias.toFixed(2)}`],
        ['Total General', `$${resumen.totalGeneral.toFixed(2)}`],
        ['Ganancia Bruta (Pagadas + Parciales)', `$${resumen.gananciaBruta.toFixed(2)}`],
        ['Ganancia Neta (Solo Pagadas)', `$${resumen.gananciaNeta.toFixed(2)}`],
      ],
      theme: 'grid',
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 12
      },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 120 },
        1: { halign: 'right', cellWidth: 60 }
      },
      didParseCell: (data: any) => {
        // Hacer las filas de ganancia en negrita
        if (data.section === 'body' && (data.row.index === 3 || data.row.index === 4)) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: margin, right: margin }
    });

    startY = (doc as any).lastAutoTable.finalY + 15;

    // Tabla: Transferencias por Cuenta
    if (Object.keys(resumen.transferenciasPorCuenta).length > 0) {
      const transferenciasData = Object.entries(resumen.transferenciasPorCuenta)
        .sort((a, b) => b[1] - a[1])
        .map(([cuenta, total]) => {
          const porcentaje = resumen.totalTransferencias > 0 
            ? ((total / resumen.totalTransferencias) * 100).toFixed(1)
            : '0.0';
          return [cuenta, `$${total.toFixed(2)}`, `${porcentaje}%`];
        });

      // Agregar fila de total
      transferenciasData.push(['TOTAL TRANSFERENCIAS', `$${resumen.totalTransferencias.toFixed(2)}`, '100%']);

      // Título: Transferencias por Cuenta
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSFERENCIAS POR CUENTA BANCARIA', margin, startY);
      startY += 8;

      autoTable(doc, {
        startY: startY,
        head: [['Cuenta Bancaria', 'Total', '% del Total']],
        body: transferenciasData,
        theme: 'grid',
        headStyles: { 
          fillColor: [52, 152, 219], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 12
        },
        bodyStyles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 120 },
          1: { halign: 'right', cellWidth: 40 },
          2: { halign: 'center', cellWidth: 20 }
        },
        didParseCell: (data: any) => {
          // Hacer la última fila (total) en negrita y con fondo
          if (data.section === 'body' && data.row.index === transferenciasData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [236, 240, 241];
          }
        },
        margin: { left: margin, right: margin }
      });

      startY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Tabla: Ganancias por Categoría
    if (Object.keys(resumen.gananciaNetaPorCategoria).length > 0) {
      const gananciasData = Object.entries(resumen.gananciaNetaPorCategoria)
        .sort((a, b) => b[1] - a[1]) // Ordenar por ganancia neta descendente
        .map(([categoria, gananciaNeta]) => {
          const gananciaBruta = resumen.gananciaBrutaPorCategoria[categoria] || 0;
          const porcentaje = resumen.gananciaNeta > 0 
            ? ((gananciaNeta / resumen.gananciaNeta) * 100).toFixed(1)
            : '0.0';
          return [categoria, `$${gananciaBruta.toFixed(2)}`, `$${gananciaNeta.toFixed(2)}`, `${porcentaje}%`];
        });

      // Agregar fila de total
      gananciasData.push(['TOTAL', `$${resumen.gananciaBruta.toFixed(2)}`, `$${resumen.gananciaNeta.toFixed(2)}`, '100%']);

      // Título: Ganancias por Categoría
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('GANANCIAS POR CATEGORÍA', margin, startY);
      startY += 8;

      autoTable(doc, {
        startY: startY,
        head: [['Categoría', 'Ganancia Bruta (Pagadas + Parciales)', 'Ganancia Neta (Solo Pagadas)', '% del Total']],
        body: gananciasData,
        theme: 'grid',
        headStyles: { 
          fillColor: [46, 125, 50], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 12
        },
        bodyStyles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { halign: 'right', cellWidth: 40 },
          2: { halign: 'right', cellWidth: 40 },
          3: { halign: 'center', cellWidth: 20 }
        },
        didParseCell: (data: any) => {
          // Hacer la última fila (total) en negrita y con fondo
          if (data.section === 'body' && data.row.index === gananciasData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [236, 240, 241];
          }
        },
        margin: { left: margin, right: margin }
      });

      startY = (doc as any).lastAutoTable.finalY + 15;
    }


    // Nombre del archivo
    const fechaInicioStr = inicio.toISOString().split('T')[0];
    const fechaFinStr = fin.toISOString().split('T')[0];
    doc.save(`Resumen_Cuentas_${fechaInicioStr}_${fechaFinStr}.pdf`);
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Resumen de Cuentas</h2>
          <p className="text-muted">Resumen de ingresos por método de pago</p>
        </Col>
        <Col xs="auto">
          <Button variant="success" onClick={exportarResumen}>
            📥 Exportar Resumen
          </Button>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Filtro de Fechas</h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={12}>
              <div className="mb-2">
                <ButtonGroup size="sm" className="me-2">
                  <Button 
                    variant="outline-primary"
                    onClick={() => establecerRangoFechas(7)}
                  >
                    Últimos 7 días
                  </Button>
                  <Button 
                    variant="outline-primary"
                    onClick={() => establecerRangoFechas(15)}
                  >
                    Últimos 15 días
                  </Button>
                  <Button 
                    variant="outline-primary"
                    onClick={() => establecerRangoFechas(30)}
                  >
                    Último mes
                  </Button>
                  <Button 
                    variant="outline-primary"
                    onClick={() => establecerRangoFechas(90)}
                  >
                    Últimos 3 meses
                  </Button>
                </ButtonGroup>
              </div>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Fecha Inicio</Form.Label>
                <Form.Control
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Fecha Fin</Form.Label>
                <Form.Control
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <div className="p-2 bg-light rounded w-100">
                <small className="text-muted">
                  <strong>Período:</strong> {formatearRangoFechas()}
                </small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title>Total Efectivo (Caja)</Card.Title>
              <p className="text-muted small mb-2" style={{ minHeight: '20px' }}></p>
              <h3 className="text-success mt-auto">
                <Badge bg="success" className="p-3 fs-4">
                  ${resumen.totalEfectivo.toFixed(2)}
                </Badge>
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title>Total Transferencias</Card.Title>
              <p className="text-muted small mb-2" style={{ minHeight: '20px' }}></p>
              <h3 className="text-info mt-auto">
                <Badge bg="info" className="p-3 fs-4">
                  ${resumen.totalTransferencias.toFixed(2)}
                </Badge>
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title>Ganancia Bruta</Card.Title>
              <p className="text-muted small mb-2">(Pagadas + Parciales)</p>
              <h3 className="text-warning mt-auto">
                <Badge bg="warning" className="p-3 fs-4">
                  ${resumen.gananciaBruta.toFixed(2)}
                </Badge>
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title>Ganancia Neta</Card.Title>
              <p className="text-muted small mb-2">(Solo Pagadas)</p>
              <h3 className="text-success mt-auto">
                <Badge bg="success" className="p-3 fs-4">
                  ${resumen.gananciaNeta.toFixed(2)}
                </Badge>
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={12}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total General</Card.Title>
              <h3 className="text-primary">
                <Badge bg="primary" className="p-3 fs-4">
                  ${resumen.totalGeneral.toFixed(2)}
                </Badge>
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tarjetas individuales por cuenta bancaria */}
      {Object.keys(resumen.transferenciasPorCuenta).length > 0 && (
        <Row className="mb-4">
          <Col>
            <h4 className="mb-3">Transferencias por Cuenta Bancaria</h4>
          </Col>
        </Row>
      )}
      <Row className="mb-4">
        {Object.entries(resumen.transferenciasPorCuenta)
          .sort((a, b) => b[1] - a[1]) // Ordenar por monto descendente
          .map(([cuenta, total]) => (
            <Col md={4} key={cuenta} className="mb-3">
              <Card className="text-center border-info">
                <Card.Body>
                  <Card.Title className="text-info">
                    <small className="text-muted d-block mb-1">Cuenta Bancaria</small>
                    {cuenta}
                  </Card.Title>
                  <h4 className="text-info mt-2">
                    <Badge bg="info" className="p-2 fs-5">
                      ${total.toFixed(2)}
                    </Badge>
                  </h4>
                </Card.Body>
              </Card>
            </Col>
          ))}
      </Row>

      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Ganancias por Categoría</h5>
              <small className="text-muted">Nota: Las ventas pendientes no se incluyen en las ganancias</small>
            </Card.Header>
            <Card.Body>
              {Object.keys(resumen.gananciaNetaPorCategoria).length === 0 ? (
                <p className="text-muted text-center">No hay ganancias registradas</p>
              ) : (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Ganancia Bruta (Pagadas + Parciales)</th>
                      <th>Ganancia Neta (Solo Pagadas)</th>
                      <th>% del Total Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(resumen.gananciaNetaPorCategoria)
                      .sort((a, b) => b[1] - a[1]) // Ordenar por ganancia neta descendente
                      .map(([categoria, gananciaNeta]) => {
                        const gananciaBruta = resumen.gananciaBrutaPorCategoria[categoria] || 0;
                        const porcentaje = resumen.gananciaNeta > 0 
                          ? ((gananciaNeta / resumen.gananciaNeta) * 100).toFixed(1)
                          : '0.0';
                        return (
                          <tr key={categoria}>
                            <td><strong>{categoria}</strong></td>
                            <td>
                              <Badge bg="warning">${gananciaBruta.toFixed(2)}</Badge>
                            </td>
                            <td>
                              <Badge bg="success">${gananciaNeta.toFixed(2)}</Badge>
                            </td>
                            <td>
                              <Badge bg="secondary">{porcentaje}%</Badge>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Total</strong></td>
                      <td>
                        <Badge bg="warning" className="fs-6">
                          ${resumen.gananciaBruta.toFixed(2)}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="success" className="fs-6">
                          ${resumen.gananciaNeta.toFixed(2)}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="secondary" className="fs-6">100%</Badge>
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Detalle de Transferencias por Cuenta</h5>
            </Card.Header>
            <Card.Body>
              {Object.keys(resumen.transferenciasPorCuenta).length === 0 ? (
                <p className="text-muted text-center">No hay transferencias registradas</p>
              ) : (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Cuenta Bancaria</th>
                      <th>Total</th>
                      <th>% del Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(resumen.transferenciasPorCuenta)
                      .sort((a, b) => b[1] - a[1]) // Ordenar por monto descendente
                      .map(([cuenta, total]) => {
                        const porcentaje = resumen.totalTransferencias > 0 
                          ? ((total / resumen.totalTransferencias) * 100).toFixed(1)
                          : '0.0';
                        return (
                          <tr key={cuenta}>
                            <td><strong>{cuenta}</strong></td>
                            <td>
                              <Badge bg="info">${total.toFixed(2)}</Badge>
                            </td>
                            <td>
                              <Badge bg="secondary">{porcentaje}%</Badge>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Total Transferencias</strong></td>
                      <td>
                        <Badge bg="info" className="fs-6">
                          ${resumen.totalTransferencias.toFixed(2)}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="secondary" className="fs-6">100%</Badge>
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Ventas Pagadas sin Método de Pago</h5>
            </Card.Header>
            <Card.Body>
              {ventasSinMetodoPago.length === 0 ? (
                <p className="text-success text-center">
                  ✓ Todas las ventas pagadas tienen método de pago registrado
                </p>
              ) : (
                <>
                  <p className="text-warning">
                    <strong>Advertencia:</strong> Hay {ventasSinMetodoPago.length} venta(s) pagada(s) sin método de pago registrado.
                  </p>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventasSinMetodoPago.map((venta) => {
                        const totalVenta = venta.precioVenta * venta.cantidad;
                        const nombreCompleto = `${venta.nombreCliente || ''} ${venta.apellidoCliente || ''}`.trim() || 'Sin nombre';
                        return (
                          <tr key={venta.id}>
                            <td>{nombreCompleto}</td>
                            <td>${totalVenta.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

// Memoizar componente para evitar re-renders innecesarios
export default memo(ResumenCuentas);

