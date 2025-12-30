import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Table, 
  Share2, 
  CheckCircle,
  RefreshCw,
  Settings,
  Eye
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

const ORGenerator = () => {
  const [restaurantId, setRestaurantId] = useState('RST001');
  const [tables, setTables] = useState([
    { id: 1, number: 'Table 1', qrCode: '', status: 'active' },
    { id: 2, number: 'Table 2', qrCode: '', status: 'active' },
    { id: 3, number: 'Table 3', qrCode: '', status: 'inactive' },
    { id: 4, number: 'Table 4', qrCode: '', status: 'active' },
    { id: 5, number: 'Table 5', qrCode: '', status: 'active' },
    { id: 6, number: 'Table 6', qrCode: '', status: 'inactive' }
  ]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [qrSize, setQrSize] = useState(256);
  const [qrColor, setQrColor] = useState('#292F36');
  const [qrBgColor, setQrBgColor] = useState('#FFFFFF');
  const [showSettings, setShowSettings] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    // Generate preview URL for current restaurant
    setPreviewUrl(`${window.location.origin}/menu/${restaurantId}`);
    
    // Generate QR codes for tables
    const updatedTables = tables.map(table => ({
      ...table,
      qrCode: `${window.location.origin}/menu/${restaurantId}?table=${table.number}`
    }));
    setTables(updatedTables);
  }, [restaurantId]);

  const handleTableSelect = (tableId) => {
    if (selectedTables.includes(tableId)) {
      setSelectedTables(selectedTables.filter(id => id !== tableId));
    } else {
      setSelectedTables([...selectedTables, tableId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTables.length === tables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(tables.map(table => table.id));
    }
  };

  const generateQRCode = (tableNumber) => {
    return `${window.location.origin}/menu/${restaurantId}?table=${tableNumber}`;
  };

  const downloadQRCode = async (tableNumber) => {
    const qrElement = document.getElementById(`qr-${tableNumber}`);
    if (qrElement) {
      try {
        const canvas = await html2canvas(qrElement);
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `QR-Table-${tableNumber}.png`;
        link.href = url;
        link.click();
        toast.success(`QR Code for ${tableNumber} downloaded`);
      } catch (error) {
        toast.error('Failed to download QR code');
      }
    }
  };

  const downloadAllSelected = async () => {
    if (selectedTables.length === 0) {
      toast.error('Please select tables to download');
      return;
    }

    toast.loading('Generating QR codes...');
    
    for (const tableId of selectedTables) {
      const table = tables.find(t => t.id === tableId);
      if (table) {
        await downloadQRCode(table.number);
      }
    }
    
    toast.dismiss();
    toast.success(`Downloaded ${selectedTables.length} QR codes`);
  };

  const printQRCode = (tableNumber) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${tableNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 40px;
            }
            .qr-container { 
              margin: 20px auto; 
              padding: 20px;
              border: 1px solid #ddd;
              display: inline-block;
            }
            .table-info {
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <h2>${tableNumber}</h2>
          <p>Scan to view menu and order</p>
          <div class="qr-container">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateQRCode(tableNumber))}" alt="QR Code" />
          </div>
          <div class="table-info">
            <p><strong>Restaurant ID:</strong> ${restaurantId}</p>
            <p><strong>URL:</strong> ${generateQRCode(tableNumber)}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copyQRCode = (tableNumber) => {
    const qrUrl = generateQRCode(tableNumber);
    navigator.clipboard.writeText(qrUrl)
      .then(() => toast.success('QR Code URL copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
  };

  const shareQRCode = async (tableNumber) => {
    const qrUrl = generateQRCode(tableNumber);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code for ${tableNumber}`,
          text: `Scan this QR code to view menu and order`,
          url: qrUrl
        });
      } catch (error) {
        console.log('Sharing cancelled');
      }
    } else {
      copyQRCode(tableNumber);
    }
  };

  const generateNewTable = () => {
    const newTableNumber = `Table ${tables.length + 1}`;
    const newTable = {
      id: tables.length + 1,
      number: newTableNumber,
      qrCode: generateQRCode(newTableNumber),
      status: 'active'
    };
    setTables([...tables, newTable]);
    toast.success(`New table ${newTableNumber} added`);
  };

  const toggleTableStatus = (tableId) => {
    setTables(tables.map(table => 
      table.id === tableId 
        ? { ...table, status: table.status === 'active' ? 'inactive' : 'active' }
        : table
    ));
  };

  const renderQRPreview = (table) => (
    <QRPreviewCard id={`qr-${table.number}`}>
      <QRCodeContainer>
        <QRCodeSVG
          value={generateQRCode(table.number)}
          size={qrSize}
          fgColor={qrColor}
          bgColor={qrBgColor}
          level="H"
          includeMargin={true}
        />
      </QRCodeContainer>
      <QRInfo>
        <TableNumber>{table.number}</TableNumber>
        <RestaurantInfo>Restaurant ID: {restaurantId}</RestaurantInfo>
        <QRUrl>{generateQRCode(table.number).substring(0, 30)}...</QRUrl>
        <TableStatus status={table.status}>
          {table.status === 'active' ? 'Active' : 'Inactive'}
        </TableStatus>
      </QRInfo>
    </QRPreviewCard>
  );

  return (
    <GeneratorContainer>
      <GeneratorHeader>
        <HeaderContent>
          <QrCode size={40} color="var(--primary-color)" />
          <div>
            <h1>QR Code Generator</h1>
            <p>Generate QR codes for your restaurant tables</p>
          </div>
        </HeaderContent>
        
        <HeaderActions>
          <ActionButton onClick={() => setShowSettings(!showSettings)}>
            <Settings size={20} />
            Settings
          </ActionButton>
          <ActionButton primary onClick={generateNewTable}>
            <RefreshCw size={20} />
            New Table
          </ActionButton>
        </HeaderActions>
      </GeneratorHeader>

      <GeneratorContent>
        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel>
            <h3>QR Code Settings</h3>
            <SettingsGrid>
              <FormGroup>
                <FormLabel>Restaurant ID</FormLabel>
                <FormControl
                  type="text"
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  placeholder="Enter restaurant ID"
                />
              </FormGroup>
              
              <FormGroup>
                <FormLabel>QR Code Size</FormLabel>
                <RangeInput>
                  <input
                    type="range"
                    min="128"
                    max="512"
                    step="32"
                    value={qrSize}
                    onChange={(e) => setQrSize(parseInt(e.target.value))}
                  />
                  <span>{qrSize}px</span>
                </RangeInput>
              </FormGroup>
              
              <FormGroup>
                <FormLabel>QR Color</FormLabel>
                <ColorInput>
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                  />
                  <span>{qrColor}</span>
                </ColorInput>
              </FormGroup>
              
              <FormGroup>
                <FormLabel>Background Color</FormLabel>
                <ColorInput>
                  <input
                    type="color"
                    value={qrBgColor}
                    onChange={(e) => setQrBgColor(e.target.value)}
                  />
                  <span>{qrBgColor}</span>
                </ColorInput>
              </FormGroup>
            </SettingsGrid>
            
            <PreviewUrl>
              <strong>Preview URL:</strong>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                {previewUrl}
              </a>
            </PreviewUrl>
          </SettingsPanel>
        )}

        {/* Tables Selection */}
        <TablesSection>
          <SectionHeader>
            <h2>Select Tables</h2>
            <SelectAllButton onClick={handleSelectAll}>
              {selectedTables.length === tables.length ? 'Deselect All' : 'Select All'}
            </SelectAllButton>
          </SectionHeader>
          
          <TablesGrid>
            {tables.map((table) => (
              <TableCard 
                key={table.id}
                selected={selectedTables.includes(table.id)}
                status={table.status}
                onClick={() => handleTableSelect(table.id)}
              >
                <TableCheckbox>
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(table.id)}
                    onChange={() => handleTableSelect(table.id)}
                  />
                </TableCheckbox>
                
                <TableIcon>
                  <Table size={24} />
                </TableIcon>
                
                <TableInfo>
                  <TableName>{table.number}</TableName>
                  <TableActions>
                    <IconButton onClick={(e) => {
                      e.stopPropagation();
                      toggleTableStatus(table.id);
                    }} title="Toggle Status">
                      {table.status === 'active' ? <CheckCircle size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </TableActions>
                </TableInfo>
              </TableCard>
            ))}
          </TablesGrid>
        </TablesSection>

        {/* Bulk Actions */}
        {selectedTables.length > 0 && (
          <BulkActions>
            <h3>Bulk Actions ({selectedTables.length} tables selected)</h3>
            <ActionButtons>
              <BulkActionButton onClick={downloadAllSelected}>
                <Download size={20} />
                Download All
              </BulkActionButton>
              <BulkActionButton secondary onClick={() => {
                selectedTables.forEach(tableId => {
                  const table = tables.find(t => t.id === tableId);
                  if (table) printQRCode(table.number);
                });
              }}>
                <Printer size={20} />
                Print All
              </BulkActionButton>
            </ActionButtons>
          </BulkActions>
        )}

        {/* QR Code Preview */}
        <PreviewSection>
          <h2>QR Code Preview</h2>
          <PreviewGrid>
            {tables.slice(0, 4).map((table) => (
              <PreviewColumn key={table.id}>
                {renderQRPreview(table)}
                
                <QRControls>
                  <ControlButton onClick={() => downloadQRCode(table.number)}>
                    <Download size={16} />
                    Download
                  </ControlButton>
                  
                  <ControlButton onClick={() => printQRCode(table.number)}>
                    <Printer size={16} />
                    Print
                  </ControlButton>
                  
                  <ControlButton onClick={() => copyQRCode(table.number)}>
                    <Copy size={16} />
                    Copy
                  </ControlButton>
                  
                  <ControlButton onClick={() => shareQRCode(table.number)}>
                    <Share2 size={16} />
                    Share
                  </ControlButton>
                </QRControls>
              </PreviewColumn>
            ))}
          </PreviewGrid>
        </PreviewSection>

        {/* Instructions */}
        <InstructionsSection>
          <h3>How to Use QR Codes</h3>
          <InstructionsGrid>
            <InstructionStep>
              <StepNumber>1</StepNumber>
              <h4>Generate QR Codes</h4>
              <p>Create unique QR codes for each table in your restaurant</p>
            </InstructionStep>
            
            <InstructionStep>
              <StepNumber>2</StepNumber>
              <h4>Print & Display</h4>
              <p>Print QR codes and place them on tables or menus</p>
            </InstructionStep>
            
            <InstructionStep>
              <StepNumber>3</StepNumber>
              <h4>Customers Scan</h4>
              <p>Customers scan QR code to view menu and place orders</p>
            </InstructionStep>
            
            <InstructionStep>
              <StepNumber>4</StepNumber>
              <h4>Receive Orders</h4>
              <p>Orders appear instantly in your dashboard</p>
            </InstructionStep>
          </InstructionsGrid>
        </InstructionsSection>
      </GeneratorContent>
    </GeneratorContainer>
  );
};

const GeneratorContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
`;

const GeneratorHeader = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: var(--shadow);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  
  h1 {
    margin-bottom: 5px;
  }
  
  p {
    color: var(--gray-color);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 15px;
`;

const ActionButton = styled.button`
  padding: 12px 24px;
  background: ${props => props.primary ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.primary ? 'white' : 'var(--dark-color)'};
  border: ${props => props.primary ? 'none' : '2px solid var(--light-gray)'};
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.primary ? '#E55A2E' : 'var(--light-gray)'};
  }
`;

const GeneratorContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const SettingsPanel = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
  
  h3 {
    margin-bottom: 20px;
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div``;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--dark-color);
`;

const FormControl = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--light-gray);
  border-radius: var(--radius);
  font-size: 16px;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const RangeInput = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  input {
    flex: 1;
  }
  
  span {
    min-width: 60px;
    text-align: right;
  }
`;

const ColorInput = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  input[type="color"] {
    width: 50px;
    height: 50px;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
  }
  
  span {
    font-family: monospace;
  }
`;

const PreviewUrl = styled.div`
  padding: 15px;
  background: var(--light-gray);
  border-radius: var(--radius);
  margin-top: 20px;
  
  a {
    display: block;
    margin-top: 5px;
    word-break: break-all;
  }
`;

const TablesSection = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const SelectAllButton = styled.button`
  padding: 10px 20px;
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--primary-color);
    color: white;
  }
`;

const TablesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
`;

const TableCard = styled.div`
  border: 2px solid ${props => props.selected ? 'var(--primary-color)' : 'var(--light-gray)'};
  border-radius: var(--radius);
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.selected ? 'rgba(255, 107, 53, 0.05)' : 'white'};
  opacity: ${props => props.status === 'inactive' ? 0.6 : 1};
  
  &:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
  }
`;

const TableCheckbox = styled.div`
  margin-bottom: 15px;
  
  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
`;

const TableIcon = styled.div`
  width: 60px;
  height: 60px;
  background: ${props => props.status === 'active' ? 'rgba(6, 214, 160, 0.1)' : 'rgba(108, 117, 125, 0.1)'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  color: ${props => props.status === 'active' ? 'var(--success-color)' : 'var(--gray-color)'};
`;

const TableInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TableName = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
`;

const TableActions = styled.div`
  display: flex;
  gap: 10px;
`;

const IconButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--gray-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background: var(--light-gray);
  }
`;

const BulkActions = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const BulkActionButton = styled.button`
  padding: 15px 30px;
  background: ${props => props.secondary ? 'transparent' : 'var(--primary-color)'};
  color: ${props => props.secondary ? 'var(--primary-color)' : 'white'};
  border: ${props => props.secondary ? '2px solid var(--primary-color)' : 'none'};
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &:hover {
    background: ${props => props.secondary ? 'rgba(255, 107, 53, 0.1)' : '#E55A2E'};
  }
`;

const PreviewSection = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-top: 30px;
`;

const PreviewColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const QRPreviewCard = styled.div`
  border: 1px solid var(--light-gray);
  border-radius: var(--radius);
  padding: 20px;
  text-align: center;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const QRInfo = styled.div`
  text-align: center;
`;

const TableNumber = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 5px;
`;

const RestaurantInfo = styled.div`
  font-size: 0.9rem;
  color: var(--gray-color);
  margin-bottom: 5px;
`;

const QRUrl = styled.div`
  font-size: 0.8rem;
  color: var(--gray-color);
  word-break: break-all;
  margin-bottom: 10px;
`;

const TableStatus = styled.div`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => props.status === 'active' ? 'rgba(6, 214, 160, 0.2)' : 'rgba(108, 117, 125, 0.2)'};
  color: ${props => props.status === 'active' ? 'var(--success-color)' : 'var(--gray-color)'};
`;

const QRControls = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const ControlButton = styled.button`
  flex: 1;
  min-width: 120px;
  padding: 10px;
  background: var(--light-gray);
  border: none;
  border-radius: var(--radius);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: #dde0e3;
  }
`;

const InstructionsSection = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow);
  
  h3 {
    text-align: center;
    margin-bottom: 40px;
  }
`;

const InstructionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
`;

const InstructionStep = styled.div`
  text-align: center;
  
  h4 {
    margin: 20px 0 10px;
  }
  
  p {
    color: var(--gray-color);
    font-size: 0.9rem;
  }
`;

const StepNumber = styled.div`
  width: 50px;
  height: 50px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 auto;
`;

export default ORGenerator;