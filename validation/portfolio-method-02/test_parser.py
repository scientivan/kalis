import json
import unittest
from pathlib import Path
from benchmark import parse_answers


class ParserRegression(unittest.TestCase):
    def test_plain_and_fenced_with_prose(self):
        answer={'answers':[{'id':'C01','status':'feasible','delta':[-1,0,0]}]}
        raw=json.dumps(answer)
        for text in [raw,'```json\n'+raw+'\n```','Penjelasan awal.\n```json\n'+raw+'\n```\nPenjelasan akhir.']:
            self.assertEqual(parse_answers(text),answer['answers'])

    def test_actual_failed_response(self):
        path=Path(__file__).parent/'model-run-1794553358289888000.json'
        run=json.loads(path.read_text());envelope=json.loads(run['stdout'])
        self.assertEqual(len(parse_answers(envelope['result'])),12)

    def test_no_silent_repair_or_selection(self):
        for raw in ['', 'API error', '{"answers":[', '{"answers":null}',
                    '{"answers":[]} and {"answers":[]}', '{"answers":[123]}']:
            with self.assertRaises(ValueError):parse_answers(raw)


if __name__=='__main__':unittest.main()
