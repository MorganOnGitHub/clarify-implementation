import pandas as pd
import numpy as np
from datetime import datetime
import os

PROHIBITED_SYMBOLS = ['$', '%', '#', '@', '!', '^', '&', '*', '(', ')', '-', '+', '=', '{', '}', '[', ']', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '?', '/','~','`']


os.makedirs("../datasets", exist_ok=True)
os.makedirs("../results", exist_ok=True)

def preprocess(path_true="../datasets/True.csv", path_fake="../datasets/Fake.csv"):

    true_df = pd.read_csv(path_true)
    fake_df = pd.read_csv(path_fake)

    return true_df, fake_df

def normalization(true_df, fake_df):

    for index, row in true_df.iterrows():
        true_df.at[index, 'text'] = row['text'].lower()
        true_df.at[index, 'title'] = row['title'].lower()

        for char in PROHIBITED_SYMBOLS:
            true_df.at[index, 'text'] = true_df.at[index, 'text'].replace(char, "")
            true_df.at[index, 'title'] = true_df.at[index, 'title'].replace(char, "")

    for index, row in fake_df.iterrows():
        fake_df.at[index, 'text'] = row['text'].lower()
        fake_df.at[index, 'title'] = row['title'].lower()

        for char in PROHIBITED_SYMBOLS:
            fake_df.at[index, 'text'] = fake_df.at[index, 'text'].replace(char, "")
            fake_df.at[index, 'title'] = fake_df.at[index, 'title'].replace(char, "")


    return true_df, fake_df


def lemmatization(true_df, fake_df):

    for index, row in true_df.iterrows():
        true_df.at[index, 'text'] = " ".join([word[:-3] if word.endswith('ies') or word.endswith('ing') else word for word in row['text'].split()])
        true_df.at[index, 'text'] = " ".join([word[:-2] if word.endswith('es') else word for word in row['text'].split()])
        true_df.at[index, 'title'] = " ".join([word[:-3] if word.endswith('ies') or word.endswith('ing') else word for word in row['title'].split()])
        true_df.at[index, 'title'] = " ".join([word[:-2] if word.endswith('es') else word for word in row['title'].split()])

    for index, row in fake_df.iterrows():
        fake_df.at[index, 'text'] = " ".join([word[:-3] if word.endswith('ies') or word.endswith('ing') else word for word in row['text'].split()])
        fake_df.at[index, 'text'] = " ".join([word[:-2] if word.endswith('es') else word for word in row['text'].split()])
        fake_df.at[index, 'title'] = " ".join([word[:-3] if word.endswith('ies') or word.endswith('ing') else word for word in row['title'].split()])
        fake_df.at[index, 'title'] = " ".join([word[:-2] if word.endswith('es') else word for word in row['title'].split()])


    return true_df, fake_df


def split(true_df, fake_df):

    min_len = min(len(true_df), len(fake_df))
    true_df = true_df.sample(n=min_len, random_state=1).reset_index(drop=True)
    fake_df = fake_df.sample(n=min_len, random_state=1).reset_index(drop=True)

    train_size = int(0.7 * min_len)
    test_size = int(0.2 * min_len)

    true_train = true_df[:train_size]
    true_test = true_df[train_size:train_size + test_size]
    true_val = true_df[train_size + test_size:]

    fake_train = fake_df[:train_size]
    fake_test = fake_df[train_size:train_size + test_size]
    fake_val = fake_df[train_size + test_size:]

    train = pd.concat([true_train, fake_train], ignore_index=True).sample(frac=1, random_state=1).reset_index(drop=True)
    test = pd.concat([true_test, fake_test], ignore_index=True).sample(frac=1, random_state=1).reset_index(drop=True)
    val = pd.concat([true_val, fake_val], ignore_index=True).sample(frac=1, random_state=1).reset_index(drop=True)

    train.to_csv("../results/train.csv", index=False)
    test.to_csv("../results/test.csv", index=False)
    val.to_csv("../results/val.csv", index=False)

# if __name__ == "__main__":
#     true_df, fake_df = preprocess()
#     true_df, fake_df = normalization(true_df, fake_df)
#     true_df, fake_df = lemmatization(true_df, fake_df)
#     split(true_df, fake_df)
