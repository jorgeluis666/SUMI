import importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('drive',Path(__file__).with_name('sync-drive.py'))
drive=importlib.util.module_from_spec(spec);spec.loader.exec_module(drive)
header='Informe de campaña\n1 de octubre de 2026 - 24 de octubre de 2026\nEstado de la campaña,Campaña,Presupuesto,Tipo de presupuesto,Costo,Impr.,Clics,Conversiones\n'
rows='Habilitada,Uno,20,Diariamente,"123,45",100,10,"2,50"\nHabilitada,Dos,30,Diariamente,"50,00",100,10,"2,50"\n'
month,records,totals,summary=drive.parse_campaign_report(header+rows,'Octubre 2026')
assert totals['cost']==173.45 and totals['clicks']==20 and totals['impressions']==200
assert totals['conversions']==5 and totals['ctr']==.1 and totals['costPerConversion']==34.69
assert summary['dailyBudget']==50
# Existing explicit totals continue to take precedence.
explicit='Total: Campañas,,,,200,200,20,5\n'
assert drive.parse_campaign_report(header+rows+explicit,'Octubre 2026')[2]['cost']==200
# English number format remains supported.
assert drive.parse_campaign_report(header+rows.replace('"123,45"','123.45').replace('"50,00"','50.00').replace('"2,50"','2.50'),'Octubre 2026')[2]==totals
print('OK: totals from API rows, explicit totals and Spanish/English decimals.')
