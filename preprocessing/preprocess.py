import pandas as pd
import numpy as np
from datetime import datetime
import os
from sklearn.model_selection import train_test_split

# PROHIBITED_SYMBOLS = ['$', '%', '#', '@', '!', '^', '&', '*', '(', ')', '-', '+', '=', '{', '}', '[', ']', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '?', '/','~','`', ',', '…', '“', '”', '‘', '’', '—', '–']


os.makedirs("../datasets", exist_ok=True)
os.makedirs("../results", exist_ok=True)

def preprocess(path_true="../datasets/True.csv", path_fake="../datasets/Fake.csv"):
    true_df = pd.read_csv(path_true).dropna()
    fake_df = pd.read_csv(path_fake).dropna()
    true_df['label'] = 0
    fake_df['label'] = 1
    return true_df, fake_df

def normalization(true_df, fake_df):
    
    for df in [true_df, fake_df]:
        df['text'] = df['text'].str.lower()
        df['title'] = df['title'].str.lower()

        # for char in PROHIBITED_SYMBOLS:
        #     df['text'] = df['text'].str.replace(char, " ", regex=False)
        #     df['title'] = df['title'].str.replace(char, " ", regex=False)

    return true_df, fake_df

def lemmatization(true_df, fake_df):

    def simple_lemmatize(text):
        words = text.split()
        lemmatized = []
        for word in words:
            if word.endswith('ies') and len(word) > 4:
                lemmatized.append(word[:-3] + 'y')
            elif word.endswith('es') and len(word) > 3:
                lemmatized.append(word[:-2])
            elif word.endswith('s') and len(word) > 2:
                lemmatized.append(word[:-1])
            else:
                lemmatized.append(word)
        return " ".join(lemmatized)
    
    for df in [true_df, fake_df]:
        df['text'] = df['text'].apply(simple_lemmatize)
        df['title'] = df['title'].apply(simple_lemmatize)
    
    return true_df, fake_df

def split(true_df, fake_df):
    df = pd.concat([true_df, fake_df], ignore_index=True)
    train_val, test = train_test_split(df, test_size=0.2, random_state=1, stratify=df['label'])
    train, val = train_test_split(train_val, test_size=0.125, random_state=1, stratify=train_val['label'])

    train.to_csv("../results/train.csv", index=False)
    test.to_csv("../results/test.csv", index=False)
    val.to_csv("../results/val.csv", index=False)

if __name__ == "__main__":
    true_df, fake_df = preprocess()
    true_df, fake_df = normalization(true_df, fake_df)
    true_df, fake_df = lemmatization(true_df, fake_df)
    split(true_df, fake_df)